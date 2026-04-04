---
name: docs-writer
description: Patterns and conventions for writing Zensical (Material for MkDocs) documentation for this project
---

## Documentation Overview

This project's documentation is built with **Zensical**, which is fully compatible
with **Material for MkDocs**. All Material for MkDocs markdown extensions apply.

- Source files live in `docs/`.
- Site config is in `zensical.toml`.
- `docs/` is excluded from Prettier (`.prettierignore`) because Prettier mangles
  MkDocs admonition syntax. Do not run Prettier on docs files.

### Directory layout

```
docs/
  index.md                       # Home page
  documentation.md
  license.md
  getting-started/
    index.md                     # Getting-started landing
    installation.md
    usage.md
    settings.md
    unlinked-tasks-panel.md
  contributing/
    index.md                     # Contributing landing
    development.md
    ci-releases.md
    opencode.md
```

Add new pages to the `nav` array in `zensical.toml` as well as creating the file.

---

## Markdown Syntax Reference

### Page frontmatter

```markdown
---
title: Custom Page Title
description: One-sentence description for SEO / social cards.
---
```

---

### Admonitions

Basic admonition — type keyword followed by body indented **4 spaces**:

```markdown
!!! note
    Body text here.
```

With a custom title:

```markdown
!!! tip "Pro tip"
    Body text here.
```

No title (title bar hidden):

```markdown
!!! warning ""
    Body text here.
```

**Collapsible** (closed by default):

```markdown
??? info "Click to expand"
    Body text here.
```

**Collapsible open by default**:

```markdown
???+ info "Expanded by default"
    Body text here.
```

**Inline** (floats right, text wraps around):

```markdown
!!! info inline end "Side note"
    Body text here.
```

**Inline left**:

```markdown
!!! info inline "Side note"
    Body text here.
```

Available types: `note`, `abstract`, `info`, `tip`, `success`, `question`,
`warning`, `failure`, `danger`, `bug`, `example`, `quote`.

---

### Code blocks

Plain fenced block:

````markdown
```python
print("hello")
```
````

With a filename title:

````markdown
```python title="src/example.py"
print("hello")
```
````

With line numbers:

````markdown
```python linenums="1"
print("hello")
```
````

With highlighted lines:

````markdown
```python hl_lines="2 3"
line 1
line 2  # highlighted
line 3  # highlighted
```
````

Highlighting a range:

````markdown
```python hl_lines="3-5"
...
```
````

---

### Content tabs

```markdown
=== "Tab one"
Content for tab one indented 4 spaces.

=== "Tab two"
Content for tab two.
```

Tabs can be nested inside admonitions (indent the `===` lines 4 spaces).

---

### Tables

```markdown
| Column A | Column B |
| -------- | -------- |
| value    | value    |
```

---

## Writing Conventions for This Project

### Tone

- Direct and factual. No marketing language.
- Second person ("you") for user-facing docs.
- Imperative mood for steps ("Click the button", not "You should click the button").
- Present tense throughout.
- Do not document implementation details or internal behaviour that the user cannot observe or control. If a behaviour is obvious from using the feature, do not call it out explicitly (e.g. do not write "the node is placed at exactly the point where you dropped it").
- Avoid pixel dimensions and other internal measurements — they are irrelevant to users and will become stale.
- Do not write defensive notes about edge cases unless they would genuinely surprise a user.

### Structure

- One `#` H1 title per file (matches the nav label).
- Use `##` sections and `###` subsections — avoid going deeper.
- Use numbered lists only for sequential steps. Use bullet lists for unordered items.
- Tables for reference data with more than two columns or three rows.

### Admonition usage

- `!!! note` — neutral extra information the reader should know.
- `!!! tip` — optional shortcut or best practice.
- `!!! warning` — something that could cause data loss or unexpected behaviour.
- `!!! info` — background context that is not strictly required.

### Code examples

- Always specify the language for syntax highlighting.
- Add a `title=` when the filename helps the reader locate the file.
- Keep examples minimal — show only what is needed for the concept being explained.

### Ordered-list Prettier workaround

Prettier reformats ordered lists in ways that break MkDocs rendering. Wrap any
ordered list that contains multi-sentence items or nested content in a
`<!-- prettier-ignore -->` comment:

```markdown
<!-- prettier-ignore -->
1. First step with a longer explanation.
2. Second step.
```

This is only needed when the list items are complex. Simple single-line ordered
lists do not require it.
