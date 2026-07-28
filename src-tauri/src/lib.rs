//! Editor — four commands are the entire native side: where to start, what is
//! in a directory, read, write. Everything else is CodeMirror in the webview.

use std::fs;
use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
pub struct Entry { path: String, name: String, dir: bool }

#[tauri::command]
fn start_dir() -> String {
    std::env::current_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "/".into())
}

/// Blocking folder picker. `pick_folder` is callback-based so the command
/// bridges it over a channel — returning "" when the user cancels keeps the
/// TypeScript side free of a null case.
#[tauri::command]
async fn pick_dir(app: tauri::AppHandle) -> String {
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog().file().pick_folder(move |p| {
        let _ = tx.send(p.map(|p| p.to_string()).unwrap_or_default());
    });
    rx.recv().unwrap_or_default()
}

#[tauri::command]
fn read_tree(path: String) -> Vec<Entry> {
    let mut out: Vec<Entry> = fs::read_dir(&path)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| !e.file_name().to_string_lossy().starts_with('.'))
        .map(|e| Entry {
            path: e.path().to_string_lossy().into_owned(),
            name: e.file_name().to_string_lossy().into_owned(),
            dir: e.file_type().map(|t| t.is_dir()).unwrap_or(false),
        })
        .collect();
    out.sort_by(|a, b| b.dir.cmp(&a.dir).then(a.name.cmp(&b.name)));
    out
}

#[tauri::command]
fn read_file(path: String) -> String {
    fs::read_to_string(&path).unwrap_or_else(|e| format!("// {path}: {e}"))
}

#[tauri::command]
fn write_file(path: String, text: String) -> String {
    match fs::write(&path, text) {
        Ok(()) => format!("wrote {path}"),
        Err(e) => format!("{path}: {e}"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![start_dir, pick_dir, read_tree, read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
