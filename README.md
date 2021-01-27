# Github Actions Runner Management for MacOS

---

## Install

```bash
$ npm install --global macrunner
```

```bash
$ yarn global add macrunner
```

## Usage

Create a new workspace, this command will ask you to enter a Github Token.
This token must have permissions to interact with self hosted runner

[Github API Reference](https://docs.github.com/en/rest/reference/actions#list-self-hosted-runners-for-a-repository)

```bash
$ macrunner create
```

List all workspace

```bash
$ macrunner list
```

Scale workspace runners

```bash
$ macrunner scale --workspace <name> --count 3
```
