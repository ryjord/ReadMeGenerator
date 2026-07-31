# readme-gen

A small command-line tool that writes a `README.md` for a Node project by reading its
`package.json` and its git remote. Around 230 lines of JavaScript in a single file.

> **Archived / not maintained.** An early experiment, kept as a record of the work.

## What it actually does

Run it inside a git repository and it will:

- Take the project title from the **directory name**
- List file types in the top level of the project using `language-detect`
- Read `package.json` and map a handful of known packages to feature bullets — it recognises
  `express`, `react`, `vue`, `next`, `nestjs`, `mongoose`, `sequelize`, `socket.io`, `nodemon`
  and `typescript`, and otherwise falls back to listing the dependency names
- Pick a one-line description from `package.json`, or infer one from those same packages
- Derive install and usage snippets from the `install`, `start` and `dev` scripts
- Read the git remote from `.git/config` and, if it is a GitHub URL, add stars/forks/issues
  badges and Contributing, Support and Acknowledgements sections
- Write a fixed table of contents and a `README.md` into the current directory

It asks you to type your repository URL and refuses to run if it does not match the remote it
already found in `.git/config`.

## What it does not do

The previous version of this README claimed a number of things that were never implemented. For
the record, there is **no** config file support (`.readmerc.json`), **no** template overrides,
**no** badge theming, **no** language percentage breakdown, and **no** pip or gem support — the
dependency analysis reads `package.json` only. There is one prompt, not a guided interactive mode.

## Installation

There is no published npm package. Clone and link it:

```bash
git clone https://github.com/ryjord/ReadMeGenerator.git
cd ReadMeGenerator
npm install
npm link
```

Then, from inside any git repository:

```bash
readme-gen
```

Or run it directly without linking:

```bash
node /path/to/ReadMeGenerator/index.js
```

Requires Node 18 or newer (`inquirer` v12 sets that floor).

**It overwrites `README.md` in the current directory without asking.** Run it on a clean working
tree so you can undo it.

## Known bugs and rough edges

Documented rather than fixed, since the project is archived:

- **The license badge is wrong.** It calls `license-checker` and takes
  `Object.values(packages)[0]?.licenses` — the licence of whichever *dependency* comes back first,
  not the project's own — and falls back to `MIT` on any error. A project with no licence at all
  still gets an MIT badge.
- **The title ignores `package.json`.** It uses the directory name, so a project checked out into a
  differently-named folder gets the wrong title.
- **The URL prompt is pointless.** It reads the remote from `.git/config`, then asks you to type the
  same URL back and exits if they differ. It guards nothing.
- Language detection only looks at the top level of the project, so it misses everything in `src/`.
- The generated "Getting Started" and "Acknowledgements" sections are fixed boilerplate.
- No tests.
- `simple-git` and `uuid` were listed as dependencies but never imported; they have been removed.

## License

MIT — see [LICENSE](LICENSE).
