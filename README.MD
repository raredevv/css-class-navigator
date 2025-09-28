# CSS Class Navigator

Navigate to CSS class definitions with Ctrl+Click from HTML, JavaScript, JSX, Vue, and PHP files.

![CSS Class Navigator Demo](https://via.placeholder.com/600x300?text=Demo+GIF+Here)

## Features

### 🎯 **Go to Definition**
- **Ctrl+Click** (or **Cmd+Click** on Mac) on any CSS class to jump to its definition
- Works across multiple file types: HTML, JS, JSX, TS, TSX, Vue, PHP
- Supports all CSS preprocessors: CSS, SCSS, Sass, Less, Stylus

### 🔍 **Smart Class Detection**
- HTML `class` attributes: `<div class="container">`
- JSX `className` props: `<div className="button primary">`
- Vue class bindings: `:class="dynamicClasses"`
- Template literals: `className={\`base ${variant}\`}`
- PHP concatenated classes: `class="btn <?= $type ?>"`

### 📁 **Intelligent File Discovery**
- Automatically finds linked CSS files (`<link>` tags in HTML)
- Detects imported CSS files (`import './styles.css'` in JS/TS)
- Searches related files by name and location
- Prioritizes relevant files (same directory, similar names)

### 🎨 **Advanced CSS Support**
- Nested selectors (SCSS/Sass)
- Multiple class combinations: `.btn.btn-primary`
- Classes in media queries and keyframes
- BEM methodology: `.block__element--modifier`
- Utility classes: `.mt-3`, `.grid-12`

### ⚡ **Performance Optimized**
- Smart caching for fast repeated lookups
- Excludes `node_modules` and build directories
- Handles large projects efficiently
- Background file watching for changes

## Quick Start

### Installation
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "CSS Class Navigator"
4. Click Install
5. Start using **Ctrl+Click** on CSS classes!

### Basic Usage

**HTML File:**
```html
<link rel="stylesheet" href="styles.css">
<div class="container">  <!-- Ctrl+Click here -->
    <h1 class="title">Hello World</h1>
</div>
```

**React Component:**
```jsx
import './Button.css';

function Button() {
    return <button className="btn btn-primary">  {/* Ctrl+Click on either class */}
        Click me
    </button>;
}
```

## Supported Languages

### Source Files (where you Ctrl+Click)
- ✅ HTML (`.html`, `.htm`)
- ✅ JavaScript (`.js`)
- ✅ JSX/React (`.jsx`)
- ✅ TypeScript (`.ts`, `.tsx`)
- ✅ Vue (`.vue`)
- ✅ PHP (`.php`)

### CSS Files (where definitions are found)
- ✅ CSS (`.css`)
- ✅ SCSS (`.scss`)
- ✅ Sass (`.sass`)
- ✅ Less (`.less`)
- ✅ Stylus (`.styl`)

## Examples

### React with CSS Modules
```jsx
// Button.jsx
import styles from './Button.module.css';

export default function Button() {
    return (
        <button className={styles.primary}>  {/* Ctrl+Click works */}
            Click me
        </button>
    );
}
```

### Vue with Scoped Styles
```vue
<template>
    <div class="card card-primary">  <!-- Both classes work -->
        <h3 class="card-title">Title</h3>
    </div>
</template>

<style scoped>
.card { background: white; }
.card-primary { border-color: blue; }
.card-title { font-size: 1.2rem; }
</style>
```

### SCSS with Nesting
```scss
.navigation {
    background: #333;
    
    &-brand {  // .navigation-brand - Ctrl+Click works
        color: white;
    }
    
    &-menu {   // .navigation-menu - Ctrl+Click works
        display: flex;
    }
}
```

## Configuration

The extension works out of the box with no configuration required. Optional settings:

```json
{
    "cssClassNavigator.enabled": true,
    "cssClassNavigator.debug": false
}
```

## Troubleshooting

### Classes Not Found?
1. **Check file links**: Ensure CSS files are properly linked (`<link>` tags) or imported (`import './style.css'`)
2. **Verify paths**: Make sure CSS file paths are correct and files exist
3. **Restart VS Code**: Sometimes helps with cache issues
4. **Check spelling**: Class names must match exactly

### Performance Issues?
1. **Exclude directories**: Add large directories to `.vscode/settings.json`:
   ```json
   {
       "files.exclude": {
           "**/node_modules": true,
           "**/dist": true
       }
   }
   ```
2. **Organize CSS**: Keep CSS files close to components
3. **Break up large files**: Split large CSS files into smaller modules

### Not Working in Specific Files?
- Ensure file extension is supported
- Check that VS Code recognizes the file type
- Try reloading the window (`Ctrl+Shift+P` → "Developer: Reload Window")

## Best Practices

### File Organization
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.css     ← Keep CSS close to components
│   └── Card/
│       ├── Card.vue
│       └── Card.scss
└── styles/
    ├── global.css         ← Global styles
    └── utilities.css      ← Utility classes
```

### CSS Naming
```css
/* ✅ Good - Clear, specific names */
.navigation-menu { }
.button-primary { }
.card-header { }

/* ✅ Good - BEM methodology */
.block__element--modifier { }

/* ⚠️ Okay - But may be slower to find */
.complex > .nested + .selector:nth-child(2) { }
```

### Import Patterns
```javascript
// ✅ Explicit imports work best
import './Component.css';
import '../shared/utilities.css';

// ✅ Relative paths are resolved
import './../../global/reset.css';
```

## Contributing

Found a bug or want to contribute? Check out the [GitHub repository](https://github.com/your-username/css-class-navigator).

### Development Setup
```bash
git clone https://github.com/your-username/css-class-navigator.git
cd css-class-navigator
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

## License

MIT - See [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial release
- Support for HTML, JS, JSX, TS, TSX, Vue, PHP
- CSS, SCSS, Sass, Less, Stylus support
- Smart file discovery and caching
- Multiple definition handling

---

**Enjoy coding with CSS Class Navigator!** 🚀

If you find this extension helpful, please consider leaving a review in the VS Code Marketplace.