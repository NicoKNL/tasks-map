# Documentation

The documentation site is built with [Zensical](https://github.com/NicoKNL/zensical) and hosted on GitHub Pages at [nicoknl.github.io/tasks-map](https://nicoknl.github.io/tasks-map/).

## Setup

Zensical is a Rust/Python-based static site generator. The recommended way to install it is via [uv](https://docs.astral.sh/uv/):

```sh
uv tool install zensical
```

Alternatively, install with pip:

```sh
pip install zensical
```

## Configuration

The site configuration lives in `zensical.toml` at the project root. It defines the site name, URL, navigation structure, and theme settings.

## Local Preview

To build and preview the documentation locally:

```sh
# Build the site into the site/ directory
zensical build --clean

# Serve locally with live reload
zensical serve
```

## Deployment

Documentation is deployed automatically. On every push to `main`, the [Documentation workflow](https://github.com/NicoKNL/tasks-map/blob/main/.github/workflows/docs.yaml) builds the site with `zensical build --clean` and deploys it to GitHub Pages.

## Adding Pages

1. Create a new `.md` file under the `docs/` directory (or a subdirectory).
2. Add the page to the `nav` section in `zensical.toml`.
3. Preview locally with `zensical serve` to verify.
