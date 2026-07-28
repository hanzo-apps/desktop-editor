# Editor

CodeMirror 6 code editor in a Tauri window — real filesystem tree, syntax highlighting, ⌘S writes through.

A **Hanzo desktop template**: one codebase, three installers (macOS, Windows,
Linux) and a web build. Fork it, `npm i`, ship.

- Live web preview: <https://desktop-editor.hanzo.app>
- Installers: <https://github.com/hanzo-templates/desktop-editor/releases/latest>
- Source: <https://github.com/hanzo-templates/desktop-editor>

## Why this exists

A native app cannot be iframed, so the gallery preview is a *real* build of the
same UI — not a screenshot and not a dead link. `src/native.ts` is the only file
that knows whether it is running inside the Tauri window or a browser tab;
everything above it is one app.

## Stack

| Layer    | Choice |
| -------- | ------ |
| Shell    | Tauri v2 (Rust core, system webview — installers are single-digit MB, not 150 MB) |
| UI       | React 19 + Vite 7 + TypeScript |
| Backend  | [`@hanzo/base`](https://www.npmjs.com/package/@hanzo/base) — collections, realtime, CRDT |
| Runtime  | `a.hanzo.ai` analytics + chat, loaded from `index.html` |
| Native   | filesystem tree + read/write (`std::fs`), native folder picker (tauri-plugin-dialog) |

## Run

```bash
npm install
npm run desktop        # Tauri dev window
npm run dev            # browser, same UI, web fallbacks
npm run desktop:build  # installers for the host OS
npm run build          # static web build -> dist/
```

Linux build deps: `libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf`.

## Backend

`src/base.ts` points at `https://base.hanzo.ai`. Point a fork at its own with
`VITE_BASE_URL`. Base is optional — the app renders and works offline, the
status bar just says so.

## Release

Push a `v*` tag. `.github/workflows/release.yml` fans out to macOS (arm64 +
x86_64), Windows and Linux runners and attaches `.dmg` / `.msi` / `.AppImage` /
`.deb` to the GitHub release. Desktop bundles must be built on their
target OS, which is why this one workflow uses per-platform runners.

## Upstream & license

Scaffold derived from **CodeMirror 6** (https://github.com/codemirror/dev), MIT.
This template is MIT — see [LICENSE](./LICENSE). Every dependency is
MIT/Apache-2.0/BSD; nothing copyleft is pulled in, so a fork can be
commercialised without contaminating it.
