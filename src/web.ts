import { bridge } from "./native";
import type { Entry } from "./app";

/** Browser fallback: a small in-memory project so the preview opens on real
 *  code. The native build talks to the actual filesystem through Rust. */
const FILES: Record<string, string> = {
  "/demo/app.tsx": `import { useState } from "react";

// The preview you are reading runs the same CodeMirror 6 setup the desktop
// build does. Only the file source differs: this tree is in memory, the
// installed app reads your disk through four Rust commands.
export default function App() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>clicked {n}</button>;
}
`,
  "/demo/lib.rs": `//! Four commands are the whole native side of an editor.

#[tauri::command]
fn read_tree(path: String) -> Vec<Entry> {
    std::fs::read_dir(&path)
        .into_iter()
        .flatten()
        .flatten()
        .map(|e| Entry::from(e))
        .collect()
}
`,
  "/demo/package.json": `{
  "name": "desktop-editor",
  "private": true,
  "scripts": {
    "desktop": "tauri dev",
    "desktop:build": "tauri build"
  }
}
`,
  "/demo/README.md": `# desktop-editor

CodeMirror 6 in a Tauri window. Cmd/Ctrl-S writes through to disk.
`,
};

export const call = bridge({
  start_dir: () => "/demo",
  pick_dir: () => "",
  read_tree: ({ path }: { path: string }): Entry[] => {
    const seen = new Set<string>();
    const out: Entry[] = [];
    for (const p of Object.keys(FILES)) {
      if (!p.startsWith(path + "/")) continue;
      const rest = p.slice(path.length + 1);
      const [head, ...tail] = rest.split("/");
      const full = path + "/" + head;
      if (seen.has(full)) continue;
      seen.add(full);
      out.push({ path: full, name: head, dir: tail.length > 0 });
    }
    return out.sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
  },
  read_file: ({ path }: { path: string }) => FILES[path] ?? "",
  write_file: ({ path, text }: { path: string; text: string }) => {
    FILES[path] = text;
    return "written (in memory — the desktop build writes to disk)";
  },
});
