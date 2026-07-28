import { invoke } from "@tauri-apps/api/core";

/** True inside the Tauri window, false in the browser preview. */
export const isNative =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * The ONE seam between the Rust core and the browser.
 *
 * A native app cannot be iframed, so every template also builds for the web —
 * and the web build has to run the *same* UI. `bridge()` takes the web
 * fallbacks and returns `call`, which is `invoke` under Tauri and the fallback
 * everywhere else. Call sites never branch; this file is the only place that
 * knows which half of the app it is running in.
 */
export function bridge<M extends Record<string, (a: any) => any>>(web: M) {
  return function call<K extends keyof M & string>(
    cmd: K,
    args?: Parameters<M[K]>[0],
  ): Promise<Awaited<ReturnType<M[K]>>> {
    return isNative
      ? invoke(cmd, args as any)
      : Promise.resolve(web[cmd](args as any));
  };
}

/** Frameless window controls. `decorations: false` means the titlebar in
 *  shell.tsx IS the chrome, so the traffic lights have to do the real work. */
export async function winctl(k: "close" | "minimize" | "toggleMaximize") {
  if (!isNative) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow()[k]();
}
