'use strict';

var conventionalChangelogCore = require('conventional-changelog-core');
var preset = require('../');
var expect = require('chai').expect;
var gitDummyCommit = require('git-dummy-commit');
var shell = require('shelljs');
var through = require('through2');
var betterThanBefore = require('better-than-before')();
var preparing = betterThanBefore.preparing;

betterThanBefore.setups([
  // Setup 1
  function() {
    shell.config.silent = true;
    shell.rm('-rf', 'tmp');
    shell.mkdir('tmp');
    shell.cd('tmp');
    shell.mkdir('git-templates');
    shell.exec('git config user.name "Test"');
    shell.exec('git config user.email "dummy@test.com"');
    
    gitDummyCommit(['[PROJ-1001] fix: avoid a bug', 'BREAKING CHANGE: The Change is huge #1.']);
    gitDummyCommit(['perf: make it faster', ' closes #1002, #1003']);
    gitDummyCommit('revert: bad commit');
    gitDummyCommit('fix: oops');
  },
  // Setup 2
  function() {
    gitDummyCommit(['[PROJ-1004] feat: addresses the issue brought up in #933']);
  },
  // Setup 3
  function() {
    gitDummyCommit(['feat: fix #988']);
  },
  // Setup 4
  function() {
    gitDummyCommit(['feat: issue brought up by @santobiasatti! on Friday']);
  },
  // Setup 5
  function() {
    gitDummyCommit(['docs: make it clear', 'BREAKING CHANGE: The Change is huge #2.']);
    gitDummyCommit(['[TNRE-1009] style: make it easier to read for @pollovignolo', 'BREAKING CHANGE: The Change is huge #3.']);
    gitDummyCommit(['[TNRE-1010] refactor: change a lot of code', 'BREAKING CHANGE: The Change is huge #4.']);
    gitDummyCommit(['test: more tests', 'BREAKING CHANGE: The Change is huge #5.']);
    gitDummyCommit(['chore: bump', 'BREAKING CHANGE: The Change is huge #6.']);
  },
  // Setup 6
  function() {
    gitDummyCommit(['feat: bump', 'BREAKING CHANGES: Also works :)']);
  },
  // Setup 7
  function() {
    shell.exec('git tag v1.4.0');
    gitDummyCommit('feat: some more features');
  },
  // Setup 8
  function() {
    gitDummyCommit(['add: include missing type']);
    gitDummyCommit(['change: update users API token']);
    gitDummyCommit(['remove: external API no longer supported']);
  },
  // Setup 9
  function() {
    gitDummyCommit(['TEST: add new tests']);
    gitDummyCommit(['Chore: update package.json version']);
    gitDummyCommit(['FEat: created new users module']);
  }
]);

function getDefaultConfig() {
  return {
    config: preset,
    pkg: {
      path: __dirname + '/fixtures/package.json'
    }
  };
}

describe('Artear preset', function() {
  it('should work if there is no semver tag', function(done) {
    preparing(1);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('* [[PROJ-1000]](https://my-organization.atlassian.net/browse/PROJ-1000) amazing new module');
        expect(chunk).to.include('* [[PROJ-1001]](https://my-organization.atlassian.net/browse/PROJ-1001) avoid a bug');
        expect(chunk).to.include('* make it faster');
        expect(chunk).to.include(', closes [[PROJ-1002](https://my-organization.atlassian.net/browse/PROJ-1002)] [[PROJ-1003](https://my-organization.atlassian.net/browse/PROJ-1003)]');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('The Change is huge #1.');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Bug Fixes');
        expect(chunk).to.include('Performance Improvements');
        expect(chunk).to.include('Reverts');
        expect(chunk).to.include('bad commit');
        expect(chunk).to.include('BREAKING CHANGES');

        expect(chunk).to.not.include('feat');
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        done();
      }));
  });

  it('should replace #[0-9]+ with JIRA ticket URL', function(done) {
    preparing(2);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[[PROJ-933]](https://my-organization.atlassian.net/browse/PROJ-933)');
        done();
      }));
  });

  it('should remove the issues that already appear in the subject', function(done) {
    preparing(3);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[[PROJ-988]](https://my-organization.atlassian.net/browse/PROJ-988)');
        expect(chunk).to.not.include('closes [[PROJ-988]](https://my-organization.atlassian.net/browse/PROJ-988)');
        done();
      }));
  });

  it('should replace @username with GitHub user URL', function(done) {
    preparing(4);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[@santobiasatti](https://github.com/santobiasatti)');
        done();
      }));
  });

  it('should not discard commit if there is BREAKING CHANGE', function(done) {
    preparing(5);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Documentation');
        expect(chunk).to.include('Styles');
        expect(chunk).to.include('Code Refactoring');
        expect(chunk).to.include('Tests');
        expect(chunk).to.include('Chores');

        done();
      }));
  });

  it('should BREAKING CHANGES the same as BREAKING CHANGE', function(done) {
    preparing(6);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Also works :)');

        done();
      }));
  });

  it('should work if there is a semver tag', function(done) {
    preparing(7);
    var i = 0;

    var config = getDefaultConfig();
    config.outputUnreleased = true;

    conventionalChangelogCore(config)
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('some more features');
        expect(chunk).to.not.include('BREAKING');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should work for commits using types "add", "change" and "remove" instead of "feat"', function(done) {
    preparing(8);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('Features');
        expect(chunk).to.include('* include missing type');
        expect(chunk).to.include('* update users API token');
        expect(chunk).to.include('* external API no longer supported');

        done();
      }));
  });

  it('should properly detected type even if it\'s not in lowercase', function(done) {
    preparing(9);

    conventionalChangelogCore(getDefaultConfig())
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('Features');
        expect(chunk).to.include('Tests');
        expect(chunk).to.include('Chores');

        done();
      }));
  });

});
