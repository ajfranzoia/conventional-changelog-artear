'use strict';

var compareFunc = require('compare-func');
var Q = require('q');
var readFile = Q.denodeify(require('fs').readFile);
var resolve = require('path').resolve;

var parserOpts = {
  headerPattern: /^(?:\[\w+-(\d+)\]\s)?(\w*)?\: (.*)$/,
  headerCorrespondence: [
    'jiraTicketId',
    'type',
    'subject'
  ],
  noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
  revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
  revertCorrespondence: ['header', 'hash']
};

var writerOpts = {
  transform: function(commit, context) {
    var pkg = context.packageData;

    if (!pkg.jira || !pkg.jira.url) {
      throw new Error('Missing "jira.url" parameter in package.json. This is required to generate proper JIRA tickets urls.');
    }

    if (!pkg.jira.projectId) {
      throw new Error('Missing "jira.projectId" parameter in package.json.');
    }

    function getJiraTicketUrl(ticketId) {
      return pkg.jira.url.replace(/\/$/, '') + '/browse/' + pkg.jira.projectId + '-' + ticketId;
    }

    var issues = [];

    if (commit.gitTags.match(/^v\d/)) {
      return;
    }

    commit.notes.forEach(function(note) {
      note.title = 'BREAKING CHANGES';
    });

    commit.type = commit.type.toLowerCase();
    if (['feat', 'add', 'change', 'remove'].indexOf(commit.type) !== -1) {
      commit.type = 'Features';
    } else if (commit.type === 'fix') {
      commit.type = 'Bug Fixes';
    } else if (commit.type === 'perf') {
      commit.type = 'Performance Improvements';
    } else if (commit.type === 'revert') {
      commit.type = 'Reverts';
    } else if (commit.type === 'docs') {
      commit.type = 'Documentation';
    } else if (commit.type === 'style') {
      commit.type = 'Styles';
    } else if (commit.type === 'refactor') {
      commit.type = 'Code Refactoring';
    } else if (commit.type === 'test') {
      commit.type = 'Tests';
    } else if (commit.type === 'chore') {
      commit.type = 'Chores';
    } else {
      commit.type = 'Uncathegorized';
    }

    if (commit.jiraTicketId) {
      commit.jiraProjectId = pkg.jira.projectId;
      commit.jiraTicketUrl = getJiraTicketUrl(commit.jiraTicketId);
    }

    if (typeof commit.hash === 'string') {
      commit.hash = commit.hash.substring(0, 7);
    }

    if (typeof commit.subject === 'string') {
      // Referenced jira issues URLs
      commit.subject = commit.subject.replace(/#([0-9]+)/g, function(_, issue) {
        issues.push(issue);
        return '[[' + pkg.jira.projectId + '-' + issue + ']](' + getJiraTicketUrl(issue) + ')';
      });

      // GitHub user URLs.
      commit.subject = commit.subject.replace(/@([a-zA-Z0-9_]+)/g, '[@$1](https://github.com/$1)');
    }

    // remove references that already appear in the subject
    commit.references = commit.references.filter(function(reference) {
      if (issues.indexOf(reference.issue) === -1) {
        return true;
      }

      return false;
    });

    return commit;
  },
  groupBy: 'type',
  commitGroupsSort: 'title',
  commitsSort: ['jiraTicket', 'subject'],
  noteGroupsSort: 'title',
  notesSort: compareFunc
};

module.exports = Q.all([
  readFile(resolve(__dirname, 'templates/template.hbs'), 'utf-8'),
  readFile(resolve(__dirname, 'templates/header.hbs'), 'utf-8'),
  readFile(resolve(__dirname, 'templates/commit.hbs'), 'utf-8'),
  readFile(resolve(__dirname, 'templates/footer.hbs'), 'utf-8')
])
  .spread(function(template, header, commit, footer) {

    writerOpts.mainTemplate = template;
    writerOpts.headerPartial = header;
    writerOpts.commitPartial = commit;
    writerOpts.footerPartial = footer;

    writerOpts.finalizeContext = function(context) {
      var pkg = context.packageData;

      context.jiraProjectKey = pkg.jira.projectId;
      context.jiraBaseTicketUrl = pkg.jira.url.replace(/\/$/, '') + '/browse/' + pkg.jira.projectId + '-';

      return context;
    };

    return {
      parserOpts: parserOpts,
      writerOpts: writerOpts
    };
  });
