// Windows release builds open no console window; everything else is in lib.rs
// so `cargo test` and the mobile targets can reach the same app builder.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run()
}
