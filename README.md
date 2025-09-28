# Go To Style (CSS Navigator)

**StyleSense by RareDevv**

Navigate your styles instantly. With **Go To Style (CSS Navigator)**, you can jump directly from any `class` or `id` in your HTML, JS, JSX, Vue, or PHP files to its corresponding CSS definition — whether it’s in a linked stylesheet or inside an inline `<style>` tag.

---

## ✨ Features

- **Ctrl/Cmd + Click** on a class or ID → instantly jump to its CSS definition.
- Works with:
  - HTML
  - JavaScript / TypeScript
  - React (JSX / TSX)
  - Vue
  - PHP
- Supports external CSS files **and** internal `<style>` tags.
- Optional search in `node_modules` (for Tailwind or 3rd-party frameworks).
- Configurable search paths for custom build directories.

---

## 🚀 Premium (coming soon)

Unlock advanced features with **StyleSense Pro**:
- Multi-file QuickPick menu if class exists in multiple CSS files.
- Framework-aware navigation (Tailwind, Bootstrap, SCSS, Sass, LESS).
- Jump to CSS variables (`var(--color)`) and mixins.
- Hover previews of styles without leaving your file.
- Faster indexing for large projects.
- Multi-root workspace support.

---

## ⚡ Installation

1. Search for **"Go To Style (CSS Navigator)"** in the [VSCode Marketplace](https://marketplace.visualstudio.com/).  
2. Click **Install**.  
3. Ctrl/Cmd + Click any class or ID → jump to definition 🎉  

---

## ⚙️ Settings

```jsonc
"goToStyle.enabled": true, // Enable/disable the extension
"goToStyle.debug": false, // Enable debug logging
"goToStyle.searchInNodeModules": false, // Include node_modules search
"goToStyle.additionalSearchPaths": [
  "**/dist/**/*.css",
  "**/build/**/*.css"
]
