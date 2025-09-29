Go To Style (CSS Navigator)
Navigate your styles instantly. Jump directly from any class or id in your HTML, JS, JSX, Vue, or PHP files to its corresponding CSS definition with a simple Ctrl+Click. Hover over classes/IDs to preview styles, and Pro users get advanced JavaScript navigation and global search.


✨ Free Features
🎯 Core Navigation

Ctrl/Cmd + Click on any CSS class or ID → jump directly to definition
Right-click context menu with "Go to Style" option (Cmd+Shift+G on macOS)
Real-time status bar showing search progress
Single file navigation - instant jump when class appears once
Hover Style Previews - Hover over a class/ID (including in querySelector, getElementById, etc.) to see its full CSS rule in a popup

🛠 Framework Support

React/JSX: className="header" ✅
Vue.js: :class="'nav'" ✅  
Angular: [class]="'sidebar'" ✅
HTML/PHP: class="content" ✅
JavaScript: querySelector('.wrapper') ✅ (CSS preview on hover)

📂 Smart Detection

Linked CSS files (<link href="...">)
CSS imports (import './style.css')
Inline <style> tags
Build directories (dist/, build/)


🚀 Pro Features
✅ Available Now

Multi-file QuickPick - Choose from multiple CSS matches with file paths and line numbers
JavaScript Navigation - Ctrl+Click on querySelector, getElementById, classList.add, etc., to choose between HTML element usage (e.g., <div class="wrapper">) or CSS style definition. Works in <script> tags or .js files
JavaScript Hover Previews - Hover over querySelector('.wrapper') to see CSS rules and HTML element usage (up to 3 lines)
Framework CSS Support - Search in Tailwind CSS and Bootstrap files (enable goToStyle.searchInNodeModules in settings)
Global CSS Search - Search for .classname or #idname via Command Palette (Cmd+Shift+C on macOS) and jump to definitions
Priority Support - Direct access for bugs and feature requests via StyleSense: Check License Status

🔜 Coming Soon

CSS Variable Navigation - Jump to var(--color) definitions (In Development)
SCSS/SASS Mixins - Navigate to @mixin definitions (Planned)
Tailwind Docs Integration - Link directly to Tailwind documentation (Planned)
Team Workspace Config - Shared settings for teams (Planned)

Get Pro License → - One-time payment, lifetime updates

⚡ Quick Start

Install from VS Code Marketplace
Ctrl+Click any CSS class or ID to jump to its definition
Hover over classes/IDs (including in JS like querySelector('.wrapper')) to preview CSS rules
Use Command Palette (Cmd+Shift+P) for commands like StyleSense: Search CSS Class or ID
For Pro features, enter your license key via StyleSense: Enter Pro License Key (use test-key for local testing)


📊 Demo


⚙️ Configuration
Customize or disable features via VS Code settings (Cmd+, on macOS). Any feature can be turned off by setting goToStyle.enabled to false or adjusting specific settings below.
{
  "goToStyle.enabled": true, // Disable to turn off all StyleSense features
  "goToStyle.debug": false, // Enable for detailed logs in Output > StyleSense (CSS Navigator)
  "goToStyle.searchInNodeModules": false, // Pro: Enable for Tailwind/Bootstrap in node_modules
  "goToStyle.additionalSearchPaths": [ // Add paths for Tailwind output or custom CSS
    "**/dist/**/*.css",
    "**/build/**/*.css",
    "**/output.css",
    "**/styles.css"
  ],
  "goToStyle.maxSearchResults": 100, // Limit CSS files searched for performance
  "goToStyle.showStatusBarInfo": true, // Show search progress in status bar
  "goToStyle.frameworkDetection": true // Enable React/Vue/Angular detection
}

🛠 Enabling Key Features

Global CSS Search: Use Cmd+Shift+C or StyleSense: Search CSS Class or ID in Command Palette. Ensure goToStyle.additionalSearchPaths includes your CSS files (e.g., Tailwind's output.css).
Tailwind/Bootstrap Support: Set goToStyle.searchInNodeModules to true for Pro users to search framework CSS in node_modules.
JavaScript Navigation: Ctrl+Click on querySelector('.wrapper') or getElementById('main') to choose between HTML element or CSS definition (Pro-only). Works in <script> tags or .js files.
JavaScript Hover Previews: Hover on querySelector('.wrapper') for CSS previews (free) or CSS + HTML previews (Pro).

🎹 Keybindings

Cmd+Shift+C: Open global CSS search (StyleSense: Search CSS Class or ID)
Cmd+Shift+G: Go to Style (StyleSense: Go to Style)
Cmd+Shift+L: Check license status (StyleSense: Check License Status)

Customize keybindings in Preferences: Open Keyboard Shortcuts (JSON).

🐞 Troubleshooting

Tailwind Classes Not Found?
Ensure goToStyle.searchInNodeModules is true (Pro-only).
Add your Tailwind output file (e.g., output.css) to goToStyle.additionalSearchPaths.
Run npx tailwindcss -i ./src/input.css -o ./src/output.css to generate CSS.
Enable goToStyle.debug and check Output channel for searched files.


JS Navigation or Hover Not Working?
Ensure the pattern matches (e.g., querySelector('.wrapper') or getElementById('main')).
For <script> tags in HTML, the extension detects JS context but treats the file as HTML.
Enable goToStyle.debug to log context detection and searched files (e.g., "Searching for class: wrapper (JS Context: true)").
Check if CSS/HTML files are in goToStyle.additionalSearchPaths.


Pro Features Not Working?
Verify Pro status: Cmd+Shift+P > StyleSense: Check License Status.
Re-enter key via StyleSense: Enter Pro License Key (use test-key for testing).


Disable Unwanted Features: Set goToStyle.enabled to false or adjust specific settings (e.g., goToStyle.showStatusBarInfo to false for status bar).

File issues at GitHub.