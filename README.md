# GitShow - Create presentations from Markdown sources

GitShow generates a [Reveal.js](https://revealjs.com) presentation from a set of plain markdown files. It allows to maintain the presentation sources separately (e.g. in a git repository) and to automatically generate a static reveal.js bundle or a PDF file from them without installing a new copy of reveal.js for each presentation. See [demo presentations](https://github.com/gitshow-js/demos) for a few examples of presentation sources.

GitShow provides a pre-configured (but still configurable) Reveal.js environment where the author can focus on creating mardown files (which can even be done directly on GitHub). It also allows the use of built-in or custom templates that define the visual style of the presentation. Knowledge of HTML, CSS, JavaScript and other related technologies is not required, but very helpful.

In addition, the [gitshow-view](https://github.com/gitshow-js/gitshow-view) application allows to instantly display the presentations shared in a public GitHub repository.


## Requirements

GitShow requires `node.js` and `npm` installed (e.g. from [NodeSource](https://github.com/nodesource/distributions)).

## Installation

Install the command line tool:

```bash
npm install -g @burgetr/gitshow
```

## Usage

Create a new presentation:

```bash
mkdir my-presentation
cd my-presentation
gitshow init
```

The `presentation.json` file now contains the presentation configuration. Edit the configuration and markdown files to add some content to the presentation. See the [reveal.js documentation](https://revealjs.com/markdown/) for information on how to use markdown in the presentation.

Get a live preview of the presentation by running

```bash
gitshow serve
```

and visiting `http://localhost:8000` with your web browser. The presentation is automatically updated when the source files change.

The PDF version of the presentation can be created using

```bash
gitshow pdf
```

A ZIP package containing a static, web-ready HTML presentation can be created using

```bash
gitshow package
```
