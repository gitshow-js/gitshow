# GitShow - Create presentations from Markdown sources

GitShow provides a simple wrapper that generates a [Reveal.js](https://revealjs.com) presentation from a set of plain markdown files. It allows to maintain the presentation sources separately (e.g. in a git repository) and to automatically generate a static reveal.js bundle or a PDF file from them without installing a new copy of reveal.js for each presentation. See the [sample presentation](https://github.com/radkovo/gitshow/tree/main/samples/start) for an example of a source presentation.

GitShow allows to avoid the complexity of Reveal.js by providing a pre-configured (but still configurable) environment where the author can focus on creating mardown files (which can even be done directly on GitHub). Knowledge of HTML, CSS, JavaScript, and other related technologies is not required, but very helpful.

## Requirements

GitShow currently requires `node.js`, `npm` and a unix shell installed (tested on Linux but might work on other systems too).

## Installation

Just clone the project from git:

```bash
git clone https://github.com/radkovo/gitshow.git
```

The cloned project contains the [gitshow.sh](https://github.com/radkovo/gitshow/blob/main/gitshow.sh) script which invokes all the functions (see below).

## Usage

(in the instructions below, replace `gitshow.sh` with the full path to the script)

Create a new presentation:

```bash
mkdir my-presentation
cd my-presentation
gitshow.sh init
```

The `presentation.json` file now contains the presentation configuration. Edit the configuration and markdown files to add some content to the presentation. See the [reveal.js documentation](https://revealjs.com/markdown/) for information on how to use markdown in the presentation.

Get a live preview of the presentation by running

```bash
gitshow.sh serve
```

and visiting `http://localhost:8000` with your web browser. The presentation is automatically updated when the source files change.

The PDF version of the presentation can be created using

```bash
gitshow.sh pdf
```

A ZIP package containing a static, web-ready HTML presentation can be created using

```bash
gitshow.sh package
```
