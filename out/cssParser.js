"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSParser = void 0;
const vscode = __importStar(require("vscode"));
class CSSParser {
    /**
     * Find all class definitions in a CSS document
     */
    findClassDefinitions(document, className) {
        const definitions = [];
        const text = document.getText();
        const lines = text.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const classMatches = this.findClassesInLine(line, className); // Removed lineIndex argument            
            for (const match of classMatches) {
                const location = new vscode.Location(document.uri, new vscode.Position(lineIndex, match.start));
                definitions.push({
                    className: match.className,
                    location,
                    selector: match.selector
                });
            }
        }
        return definitions;
    }
    /**
     * Find class matches in a single line
     */
    findClassesInLine(line, targetClass) {
        const matches = [];
        // Remove comments
        const cleanLine = this.removeComments(line);
        // Look for class selectors
        const classRegex = /\.([a-zA-Z0-9_-]+)/g;
        let match;
        while ((match = classRegex.exec(cleanLine)) !== null) {
            const foundClass = match[1];
            if (foundClass === targetClass) {
                // Extract the full selector context
                const selector = this.extractFullSelector(cleanLine, match.index);
                matches.push({
                    className: foundClass,
                    selector,
                    start: match.index
                });
            }
        }
        return matches;
    }
    /**
     * Remove CSS comments from a line
     */
    removeComments(line) {
        // Remove single-line comments (// style)
        let result = line.replace(/\/\/.*$/, '');
        // Remove multi-line comments (/* */ style) - simplified
        result = result.replace(/\/\*.*?\*\//g, '');
        return result;
    }
    /**
     * Extract the full CSS selector from a line
     */
    extractFullSelector(line, classPosition) {
        // Find the start of the selector (beginning of line or after })
        let start = 0;
        for (let i = classPosition - 1; i >= 0; i--) {
            if (line[i] === '}' || line[i] === ',') {
                start = i + 1;
                break;
            }
        }
        // Find the end of the selector (before { or end of line)
        let end = line.length;
        for (let i = classPosition; i < line.length; i++) {
            if (line[i] === '{' || line[i] === ',') {
                end = i;
                break;
            }
        }
        return line.substring(start, end).trim();
    }
    /**
     * Parse CSS and extract all class names
     */
    extractAllClasses(cssText) {
        const classes = new Set();
        const classRegex = /\.([a-zA-Z0-9_-]+)/g;
        let match;
        // Remove comments first
        const cleanText = this.removeAllComments(cssText);
        while ((match = classRegex.exec(cleanText)) !== null) {
            const className = match[1];
            classes.add(className);
        }
        return classes;
    }
    /**
     * Remove all CSS comments from text
     */
    removeAllComments(text) {
        // Remove multi-line comments
        let result = text.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove single-line comments
        result = result.replace(/\/\/.*$/gm, '');
        return result;
    }
    /**
     * Check if a line contains a CSS rule
     */
    isRuleLine(line) {
        const cleanLine = this.removeComments(line.trim());
        // Skip empty lines
        if (!cleanLine) {
            return false;
        }
        // Skip @rules (media queries, imports, etc.)
        if (cleanLine.startsWith('@')) {
            return false;
        }
        // Must contain a selector (class, id, or element)
        return /[.#a-zA-Z]/.test(cleanLine) && !cleanLine.includes(':') || cleanLine.includes('{');
    }
    /**
     * Parse SCSS/Sass nested selectors
     */
    parseNestedSelectors(text) {
        const classPositions = new Map();
        const lines = text.split('\n');
        const selectorStack = [];
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmedLine = line.trim();
            // Skip comments and empty lines
            if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
                continue;
            }
            // Handle opening braces
            if (trimmedLine.includes('{')) {
                const selectorPart = trimmedLine.split('{')[0].trim();
                if (selectorPart) {
                    selectorStack.push(selectorPart);
                }
            }
            // Handle closing braces
            if (trimmedLine.includes('}')) {
                selectorStack.pop();
            }
            // Extract classes from current line
            const classRegex = /\.([a-zA-Z0-9_-]+)/g;
            let match;
            while ((match = classRegex.exec(line)) !== null) {
                const className = match[1];
                const position = new vscode.Position(lineIndex, match.index);
                if (!classPositions.has(className)) {
                    classPositions.set(className, []);
                }
                classPositions.get(className).push(position);
            }
        }
        return classPositions;
    }
    /**
     * Get the current selector context at a given position
     */
    getSelectorContext(document, position) {
        const text = document.getText();
        const offset = document.offsetAt(position);
        let braceCount = 0;
        let currentSelector = '';
        // Work backwards to find the opening brace
        for (let i = offset; i >= 0; i--) {
            const char = text[i];
            if (char === '}') {
                braceCount++;
            }
            else if (char === '{') {
                braceCount--;
                if (braceCount < 0) {
                    // Found the opening brace for current rule
                    // Extract selector before this brace
                    let selectorStart = i;
                    while (selectorStart > 0 && text[selectorStart - 1] !== '}' && text[selectorStart - 1] !== '\n') {
                        selectorStart--;
                    }
                    currentSelector = text.substring(selectorStart, i).trim();
                    break;
                }
            }
        }
        return currentSelector;
    }
}
exports.CSSParser = CSSParser;
//# sourceMappingURL=cssParser.js.map