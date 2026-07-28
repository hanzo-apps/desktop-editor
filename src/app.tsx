import { useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, indentUnit } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { Win, NavItem } from "./shell";
import { isNative } from "./native";
import { call } from "./web";

const RELEASES = "https://github.com/hanzo-templates/desktop-editor/releases/latest";

export type Entry = { path: string; name: string; dir: boolean };

const lang = (p: string) =>
  /\.rs$/.test(p) ? rust()
  : /\.json$/.test(p) ? json()
  : /\.(ts|tsx|js|jsx|mjs)$/.test(p) ? javascript({ typescript: /\.tsx?$/.test(p), jsx: /x$/.test(p) })
  : [];

export default function App() {
  const [root, setRoot] = useState("");
  const [tree, setTree] = useState<Entry[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [path, setPath] = useState("");
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  async function load(dir: string) {
    setRoot(dir);
    const t = await call("read_tree", { path: dir });
    setTree(t);
    return t;
  }
  function pick(p: string) {
    setPath(p);
    setOpen((o) => (o.includes(p) ? o : [...o, p]));
  }
  // Open on real code, not an empty pane.
  useEffect(() => {
    call("start_dir")
      .then(load)
      .then((t) => {
        const f = t.find((e) => !e.dir && /\.(tsx?|rs|jsx?)$/.test(e.name)) ?? t.find((e) => !e.dir);
        if (f) pick(f.path);
      });
  }, []);

  // One EditorView, reconfigured per file. Creating a view per tab leaks DOM
  // and loses undo history; swapping state keeps both cheap.
  useEffect(() => {
    if (!host.current || !path) return;
    let dead = false;
    call("read_file", { path }).then((text) => {
      if (dead || !host.current) return;
      view.current?.destroy();
      view.current = new EditorView({
        parent: host.current,
        state: EditorState.create({
          doc: text,
          extensions: [
            lineNumbers(), history(), highlightActiveLine(),
            keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            indentUnit.of("  "), oneDark, lang(path), EditorView.lineWrapping,
            EditorView.updateListener.of((u) => u.docChanged && setDirty(true)),
          ],
        }),
      });
      setDirty(false);
    });
    return () => { dead = true; };
  }, [path]);

  async function save() {
    if (!view.current || !path) return;
    const r = await call("write_file", { path, text: view.current.state.doc.toString() });
    setNote(r);
    setDirty(false);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [path]);

  const files = useMemo(() => tree.filter((e) => !e.dir), [tree]);
  const dirs = useMemo(() => tree.filter((e) => e.dir), [tree]);

  return (
    <Win
      title="Editor"
      sub={path ? path.split("/").pop() + (dirty ? " •" : "") : root.split("/").pop()}
      releases={RELEASES}
      wide
      flush
      status={
        <>
          <span className="mono">{path || root || "…"}</span>
          <span className="grow" />
          {note && <span>{note}</span>}
          <span>{dirty ? "unsaved — ⌘S" : "saved"}</span>
          <span>{isNative ? "real filesystem" : "sample project"}</span>
        </>
      }
      actions={
        <button className="btn" onClick={async () => {
          const picked = await call("pick_dir");
          if (picked) load(picked);
        }}>open folder…</button>
      }
      side={
        <>
          <h2>{root.split("/").filter(Boolean).pop() || "project"}</h2>
          <nav className="nav">
            {dirs.map((e) => (
              <NavItem key={e.path} on={false} onClick={() => load(e.path)}>
                <span className="dim">/</span>{e.name}
              </NavItem>
            ))}
            {files.map((e) => (
              <NavItem key={e.path} on={e.path === path} onClick={() => pick(e.path)}>
                {e.name}
              </NavItem>
            ))}
            {tree.length === 0 && <div className="empty">empty folder</div>}
          </nav>
          {open.length > 0 && (
            <>
              <h2>Open</h2>
              <nav className="nav">
                {open.map((p) => (
                  <NavItem key={p} on={p === path} onClick={() => setPath(p)}>
                    {p.split("/").pop()}
                  </NavItem>
                ))}
              </nav>
            </>
          )}
        </>
      }
    >
      {path ? (
        <div ref={host} className="cm-host" />
      ) : (
        <div className="empty">pick a file</div>
      )}
    </Win>
  );
}
