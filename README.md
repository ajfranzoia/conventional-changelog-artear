#  [![CircleCI][circle-badge]][circle-url] [![Dependency Status][daviddm-image]][daviddm-url]

> [conventional-changelog](https://github.com/ajoslin/conventional-changelog) [angular](https://github.com/angular/angular) preset

See parent [convention](convention.md)

## Installation

* Install package
`yarn add --dev git@github.com/Artear/conventional-changelog-artear.git` or
`npm install --save-dev git@github.com/Artear/conventional-changelog-artear.git`

* Configure Jira options in `package.json`
```
  // ...
  "jira": {
    "url": "https://artear.atlassian.net/",
    "projectId": "TNRE"
  }
```

* Add scripts to auto generate changelog and push tags during version publish
```
"scripts": {
  // ...
  "version": "conventional-changelog -p artear -i CHANGELOG.md -s && git add CHANGELOG.md",
  "postversion": "git push --follow-tags"
}
```

## Flow

1. Make changes
2. Commit those changes
3. Make sure build turns green
4. In master, bump version in package.json (done automatically using `npm|yarn version`)
5. Update changelog (done using `version` script in package.json)
6. Commit package.json and CHANGELOG.md files (done using `version` script in package.json)
7. Tag (done automatically using `npm|yarn version`)
8. Push (done using `postversion` script)


## Generate default changelog from existing history

Run `./node_modules/.bin/conventional-changelog -p artear -i CHANGELOG.md -s -r 0` 

## Github releaser

* Install package
    (`https://github.com/conventional-changelog/conventional-github-releaser`)
* Setup Github token
    (`https://github.com/conventional-changelog/conventional-github-releaser#setup-token-for-cli`)
* Optionally, add the release step during after the version phase
    `"postversion": "git push --follow-tags && conventional-github-releaser -p angular"`

[circle-badge]: https://circleci.com/gh/ajfranzoia/conventional-changelog-artear.svg?style=shield
[circle-url]: https://circleci.com/gh/ajfranzoia/conventional-changelog-artear
[daviddm-image]: https://david-dm.org/ajfranzoia/conventional-changelog-artear.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/ajfranzoia/conventional-changelog-arteartear
