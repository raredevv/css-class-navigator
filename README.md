# Go To Style (CSS Navigator - StyleSense)

<p align="left">
  <strong>Navigate your styles instantly.</strong> <br>
  Jump directly from any class or id in your HTML, JS, JSX, Vue, or PHP files to its corresponding CSS definition with a simple <kbd>Ctrl+Click</kbd>.
</p>

<p align="left">
  Hover over classes/IDs to preview styles, and Pro users get advanced JavaScript navigation and global search.
</p>

---

## ✨ Free Features

<details open>
<summary><strong>🎯 Core Navigation</strong></summary>

<br>

- **Instant Jump to Definition**: <kbd>Ctrl/Cmd + Click</kbd> on any CSS class or ID to jump directly to its definition
- **Context Menu**: Right-click and select "Go to Style" option (<kbd>Cmd+Shift+G</kbd> on macOS)
- **Real-time Progress**: Status bar showing search progress
- **Single File Navigation**: Instant jump when class appears once
- **Hover Style Previews**: Hover over a class/ID (including in `querySelector`, `getElementById`, etc.) to see its full CSS rule in a popup

</details>

<details open>
<summary><strong>🛠 Framework Support</strong></summary>

<br>

| Framework | Example | Status |
|-----------|---------|--------|
| React/JSX | `className="header"` | ✅ |
| Vue.js | `:class="'nav'"` | ✅ |
| Angular | `[class]="'sidebar'"` | ✅ |
| HTML/PHP | `class="content"` | ✅ |
| JavaScript | `querySelector('.wrapper')` | ✅ (CSS preview on hover) |

</details>

<details open>
<summary><strong>📂 Smart Detection</strong></summary>

<br>

The extension automatically detects CSS in:

- Linked CSS files (`<link href="...">`)
- CSS imports (`import './style.css'`)
- Inline `<style>` tags
- Build directories (`dist/`, `build/`)

</details>

---

## 🚀 Pro Features

> **Note**: The payment gateway for Pro features is currently in progress. To get early access to Pro features or receive updates on availability, contact us at **augustinedevv@gmail.com**. One-time payment with lifetime updates will be available soon!

<details>
<summary><strong>✅ Available Now</strong></summary>

<br>

### Multi-file QuickPick
Choose from multiple CSS matches with file paths and line numbers when a class appears in multiple locations.

### JavaScript Navigation
<kbd>Ctrl+Click</kbd> on `querySelector`, `getElementById`, `classList.add`, etc., to choose between:
- HTML element usage (e.g., `<div class="wrapper">`)
- CSS style definition

Works in `<script>` tags or `.js` files.

### JavaScript Hover Previews
Hover over `querySelector('.wrapper')` to see:
- CSS rules (free tier)
- CSS rules + HTML element usage (Pro tier, up to 3 lines)

### Framework CSS Support
Search in Tailwind CSS and Bootstrap files (enable `goToStyle.searchInNodeModules` in settings).

### Global CSS Search
Search for `.classname` or `#idname` via Command Palette (<kbd>Cmd+Shift+C</kbd> on macOS) and jump to definitions.

### Priority Support
Direct access for bugs and feature requests via **StyleSense: Check License Status**.

</details>

<details>
<summary><strong>🔜 Coming Soon</strong></summary>

<br>

- **CSS Variable Navigation**: Jump to `var(--color)` definitions
- **SCSS/SASS Mixins**: Navigate to `@mixin` definitions
- **Tailwind Docs Integration**: Link directly to Tailwind documentation
- **Team Workspace Config**: Shared settings for teams

</details>

---

## ⚡ Quick Start

1. **Install** from [VS Code Marketplace](https://marketplace.visualstudio.com)
2. **Navigate**: <kbd>Ctrl+Click</kbd> any CSS class or ID to jump to its definition
3. **Preview**: Hover over classes/IDs (including in JS like `querySelector('.wrapper')`) to preview CSS rules
4. **Search**: Use Command Palette (<kbd>Cmd+Shift+P</kbd>) for commands like **StyleSense: Search CSS Class or ID**
5. **Pro Access**: For Pro features (once available), enter your license key via **StyleSense: Enter Pro License Key**

---

## ⚙️ Configuration

Access settings via <kbd>Cmd+,</kbd> on macOS or <kbd>Ctrl+,</kbd> on Windows/Linux. Search for "Go To Style" to customize behavior.

### Default Configuration

```json
{
  "goToStyle.enabled": true,
  "goToStyle.debug": false,
  "goToStyle.searchInNodeModules": false,
  "goToStyle.additionalSearchPaths": [
    "**/dist/**/*.css",
    "**/build/**/*.css",
    "**/output.css",
    "**/styles.css"
  ],
  "goToStyle.maxSearchResults": 100,
  "goToStyle.showStatusBarInfo": true,
  "goToStyle.frameworkDetection": true
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `goToStyle.enabled` | boolean | `true` | Enable or disable all StyleSense features |
| `goToStyle.debug` | boolean | `false` | Show detailed logs in Output panel (StyleSense channel) |
| `goToStyle.searchInNodeModules` | boolean | `false` | **[Pro]** Search Tailwind/Bootstrap in node_modules |
| `goToStyle.additionalSearchPaths` | array | see above | Additional glob patterns for CSS file discovery |
| `goToStyle.maxSearchResults` | number | `100` | Maximum number of CSS files to search |
| `goToStyle.showStatusBarInfo` | boolean | `true` | Display search progress in status bar |
| `goToStyle.frameworkDetection` | boolean | `true` | Auto-detect React/Vue/Angular syntax |

<details>
<summary><strong>🛠 Enabling Key Features</strong></summary>

<br>

### Global CSS Search
Use <kbd>Cmd+Shift+C</kbd> or **StyleSense: Search CSS Class or ID** in Command Palette (Pro-only, available after payment gateway launch). Ensure `goToStyle.additionalSearchPaths` includes your CSS files (e.g., Tailwind's `output.css`).

### Tailwind/Bootstrap Support
Set `goToStyle.searchInNodeModules` to `true` for Pro users to search framework CSS in `node_modules` (available after payment gateway launch).

### JavaScript Navigation
<kbd>Ctrl+Click</kbd> on `querySelector('.wrapper')` or `getElementById('main')` to choose between HTML element or CSS definition (Pro-only, available after payment gateway launch). Works in `<script>` tags or `.js` files.

### JavaScript Hover Previews
Hover on `querySelector('.wrapper')` for CSS previews (free) or CSS + HTML previews (Pro, available after payment gateway launch).

</details>

---

## 🎹 Keybindings

| Shortcut | Action |
|----------|--------|
| <kbd>Cmd+Shift+C</kbd> | Open global CSS search (StyleSense: Search CSS Class or ID) |
| <kbd>Cmd+Shift+G</kbd> | Go to Style (StyleSense: Go to Style) |
| <kbd>Cmd+Shift+L</kbd> | Check license status (StyleSense: Check License Status) |

> **Tip**: Customize keybindings in **Preferences: Open Keyboard Shortcuts (JSON)**.

---

## 🐞 Troubleshooting

<details>
<summary><strong>Tailwind Classes Not Found?</strong></summary>

<br>

1. Ensure `goToStyle.searchInNodeModules` is `true` (Pro-only, available after payment gateway launch)
2. Add your Tailwind output file (e.g., `output.css`) to `goToStyle.additionalSearchPaths`
3. Run `npx tailwindcss -i ./src/input.css -o ./src/output.css` to generate CSS
4. Enable `goToStyle.debug` and check **Output** channel for searched files

</details>

<details>
<summary><strong>JS Navigation or Hover Not Working?</strong></summary>

<br>

1. Ensure the pattern matches (e.g., `querySelector('.wrapper')` or `getElementById('main')`)
2. For `<script>` tags in HTML, the extension detects JS context but treats the file as HTML
3. Enable `goToStyle.debug` to log context detection and searched files (e.g., "Searching for class: wrapper (JS Context: true)")
4. Check if CSS/HTML files are in `goToStyle.additionalSearchPaths`

</details>

<details>
<summary><strong>Pro Features Not Working?</strong></summary>

<br>

- Pro features will be available after the payment gateway is launched. Contact **augustinedevv@gmail.com** for updates or early access


</details>

<details>
<summary><strong>Disable Unwanted Features</strong></summary>

<br>

Set `goToStyle.enabled` to `false` or adjust specific settings (e.g., `goToStyle.showStatusBarInfo` to `false` for status bar).

</details>

**File issues at [GitHub](https://github.com/raredevv/css-class-navigator/issues)**

---

## 📝 License

MIT

## 💬 Support

- **Email**: augustinedevv@gmail.com
- **Issues**: [GitHub Issues](https://github.com/raredevv/css-class-navigator/issues)
- **Repository**: [github.com/raredevv/css-class-navigator](https://github.com/raredevv/css-class-navigator)

---

<p align="center">
  Made with ❤️ by Augustinedevv Team
</p>