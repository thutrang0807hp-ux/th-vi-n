# Lofi Train Focus

The Focus tools are available in the four scenery previews in `ban-review/`. Open **Focus** or press **F**. The small timer remains available while the panel is closed.

- **Đồng hồ** has Focus, short break, long break and stopwatch modes. **Cài đặt đồng hồ** contains durations, automatic starts and optional alerts.
- **Công việc** selects the task associated with the next focus session. Changing the selection leaves a running or paused session attached to its original task.
- **Ghi chú** saves plain-text edits locally and supports a task link.
- **Âm thanh** provides independent tracks, master volume and editable presets. Select **Phát âm thanh** after a reload to continue with the saved mix.
- **Mochi đồng hành** controls automatic reactions when seated. Start a session, then use **Ngồi xem Mochi** to sit, show the avatar and close the panel. The reduced-motion setting and manually selected activities take precedence.

If WebGL initialization fails, the scenery page displays its preview image and still mounts the timer, planner and sound controls. Seating, camera controls and companion reactions require the 3D scene. The train sound remains paused in this mode.

## Development

Serve the checkout over localhost, for example `python3 -m http.server 8000` from the repository root, then open `/ban-review/toa-tau/lang-3d.html?scene=iceland`. The other route values are `ocean`, `tri-ton` and `tulip`.

The modular entry and `lounge.css` are the sources for the controls. Source modules are:

- `timer.js` — timestamp-based timer, session history and IndexedDB schema.
- `planner.js` — tasks, notes, drafts and task progress.
- `sound.js` — native audio mixer with a shared Web Audio context.
- `companion.js` — optional reactions based on timer and task events.
- `fallback.js` — mounts the available tools when the 3D scene fails to initialize.

After changing Focus controls, styles or modules, run `python3 ban-review/scripts/sync-focus-previews.py` from the repository root. Use `--check` to verify the checked-in standalone pages. The script leaves each page's route and existing scenery assets intact. The standalone pages still need the sibling `assets/` directory to play audio.

Timer, task and note data use IndexedDB on the current browser origin. Sound settings, companion preferences and pending note drafts use localStorage. Data can follow the user across scenes served under the same origin. A different origin or a browser profile does not share it. Start audio by user gesture. No account sync or new runtime dependencies are used.
