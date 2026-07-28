import type { ReactNode } from "react";
import { isNative, winctl } from "./native";

/**
 * The window chrome every Hanzo desktop template renders inside: a draggable
 * titlebar, an optional sidebar, a status bar.
 *
 * The browser preview renders the same markup plus one honest ribbon: a native
 * app cannot be iframed, so the preview says what it is and links the real
 * installers rather than pretending to be the shipped binary.
 */
export function Win(p: {
  title: string;
  sub?: string;
  actions?: ReactNode;
  side?: ReactNode;
  status?: ReactNode;
  wide?: boolean;
  flush?: boolean;
  releases: string;
  children: ReactNode;
}) {
  return (
    <div className="win">
      <header className="titlebar" data-tauri-drag-region>
        <div className="lights">
          <i onClick={() => winctl("close")} />
          <i onClick={() => winctl("minimize")} />
          <i onClick={() => winctl("toggleMaximize")} />
        </div>
        <h1>{p.title}</h1>
        {p.sub && <span className="sub">{p.sub}</span>}
        <span className="grow" data-tauri-drag-region />
        {!isNative && (
          <span className="ribbon">
            web preview —{" "}
            <a href={p.releases} target="_blank" rel="noreferrer">
              download for macOS / Windows / Linux
            </a>
          </span>
        )}
        {p.actions && <span className="act">{p.actions}</span>}
      </header>
      <div className={"body" + (p.side ? (p.wide ? " wide" : "") : " solo")}>
        {p.side && <aside className="sidebar">{p.side}</aside>}
        <main className={"main" + (p.flush ? " flush" : "")}>{p.children}</main>
      </div>
      <footer className="statusbar">
        <b>{isNative ? "native" : "web"}</b>
        {p.status}
      </footer>
    </div>
  );
}

/** Sidebar nav row — one shape for every template's navigation. */
export function NavItem(p: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  tail?: ReactNode;
  dot?: boolean;
}) {
  return (
    <button aria-current={p.on} onClick={p.onClick}>
      {p.dot && <span className="dot" />}
      {p.children}
      {p.tail !== undefined && <span className="tail">{p.tail}</span>}
    </button>
  );
}
