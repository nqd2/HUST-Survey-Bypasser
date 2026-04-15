# HUST Survey Auto-Bypass

Chrome extension (Manifest V3) that auto-fills certain HUST survey pages and can submit when done. Settings persist in `chrome.storage.sync`.

## Supported pages

| Host | Path | Behavior |
|------|------|----------|
| `ctt-sis.hust.edu.vn` | `/Surveys/dghp.aspx*` | For rows whose label starts with `4.` or `4:`, clicks the first rating control in that row, then submits. |
| `e.hust.edu.vn` | `/survey/*` | Fills required controls: random option for radio groups, random non-empty subset for checkbox groups, middle column for Likert matrix tables, `.` for required short text. Waits for the React form to mount, then submits once. |

Optional questions are skipped where the extension only targets required fields (e.g. `aria-required`, `ant-form-item-required`, or Ant Table Likert detection for matrix blocks).

## Settings (in-page panel)

There is **no popup**. A small floating panel is injected at the **bottom-right** of supported survey tabs:

- **Tự động điền** — Turn off to load the page without auto-fill.
- **Hiện thông báo** — Turn off to suppress the completion `alert` after submit.

## Installation

1. Clone or download this repo and use the folder that contains `manifest.json` (do not load a zip without unpacking).
2. Open `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select that folder.

## Usage

1. Open a supported survey URL while logged in.
2. Adjust toggles on the panel if needed.
3. On load, the script runs once per page load (e.hust also retries while the form appears).

## Disclaimer

Educational / time-saving use only. You are responsible for the answers you submit. Prefer filling surveys honestly when feedback matters.

## License

MIT — see [LICENSE](LICENSE).
