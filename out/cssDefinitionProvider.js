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
exports.CSSDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
// import * as path from 'path';
const cssParser_1 = require("./cssParser");
const fileUtils_1 = require("./fileUtils");
class CSSDefinitionProvider {
    constructor() {
        this.cache = new Map();
        this.enabled = true;
        this.debug = false;
        this.cssParser = new cssParser_1.CSSParser();
        this.fileUtils = new fileUtils_1.FileUtils();
        this.updateConfiguration();
    }
    /**
     * Update configuration from VS Code settings
     */
    updateConfiguration() {
        const config = vscode.workspace.getConfiguration('cssClassNavigator');
        this.enabled = config.get('enabled', true);
        this.debug = config.get('debug', false);
        if (this.debug) {
            console.log('CSS Class Navigator: Configuration updated', { enabled: this.enabled, debug: this.debug });
        }
    }
    /**
     * Clear the definition cache
     */
    clearCache() {
        this.cache.clear();
        if (this.debug) {
            console.log('CSS Class Navigator: Cache cleared');
        }
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.cache.clear();
    }
    /**
     * Provide definitions for CSS classes
     */
    async provideDefinition(document, position, _token) {
        if (this.debug) {
            console.log('CSS Class Navigator: provideDefinition called for', document.uri.fsPath, 'at position', position);
        }
        if (!this.enabled) {
            if (this.debug) {
                console.log('CSS Class Navigator: Extension disabled');
            }
            return undefined;
        }
        try {
            const className = this.extractClassName(document, position);
            if (!className) {
                if (this.debug) {
                    console.log('CSS Class Navigator: No class name found at position');
                }
                return undefined;
            }
            if (this.debug) {
                console.log('CSS Class Navigator: Looking for class:', className);
            }
            const definitions = await this.findDefinitions(className, document);
            if (definitions.length === 0) {
                if (this.debug) {
                    console.log('CSS Class Navigator: No definitions found for:', className);
                }
                return undefined;
            }
            if (this.debug) {
                console.log('CSS Class Navigator: Found definitions:', definitions.length);
            }
            return definitions.map(def => def.location);
        }
        catch (error) {
            console.error('CSS Class Navigator: Error providing definition:', error);
            return undefined;
        }
    }
    /**
     * Extract CSS class name at the given position
     */
    extractClassName(document, position) {
        // Get a larger word range that includes common CSS class characters
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
        if (!wordRange) {
            if (this.debug) {
                console.log('CSS Class Navigator: No word range found');
            }
            return undefined;
        }
        const word = document.getText(wordRange);
        const line = document.lineAt(position).text;
        if (this.debug) {
            console.log('CSS Class Navigator: Word found:', word, 'Line:', line);
        }
        // Check if this looks like a CSS class based on context
        if (this.isClassContext(document, position, wordRange)) {
            return word;
        }
        if (this.debug) {
            console.log('CSS Class Navigator: Word not in class context');
        }
        return undefined;
    }
    /**
     * Check if the word is in a CSS class context
     */
    isClassContext(document, position, wordRange) {
        const line = document.lineAt(position).text;
        const charBefore = wordRange.start.character > 0 ?
            line.charAt(wordRange.start.character - 1) : '';
        const charsBefore = wordRange.start.character > 10 ?
            line.substring(wordRange.start.character - 10, wordRange.start.character) :
            line.substring(0, wordRange.start.character);
        if (this.debug) {
            console.log('CSS Class Navigator: Context check - charBefore:', charBefore, 'charsBefore:', charsBefore);
        }
        // CSS selector (when editing CSS files)
        if (charBefore === '.') {
            return true;
        }
        // HTML class attribute: class="word" or class='word'
        if (/class\s*=\s*["'][^"']*$/.test(charsBefore)) {
            return true;
        }
        // JSX className attribute: className="word" or className='word'
        if (/className\s*=\s*["'][^"']*$/.test(charsBefore)) {
            return true;
        }
        // Multiple classes: class="other-class word"
        if (/class(?:Name)?\s*=\s*["'][^"']*\s/.test(charsBefore) && /\s$/.test(charsBefore)) {
            return true;
        }
        // Vue class binding: :class or v-bind:class
        if (line.includes(':class') || line.includes('v-bind:class')) {
            return true;
        }
        // Template literals
        if (line.includes('`') && /[`][^`]*$/.test(charsBefore)) {
            return true;
        }
        return false;
    }
    /**
     * Find all definitions for a CSS class
     */
    async findDefinitions(className, document) {
        const cacheKey = `${className}-${document.uri.fsPath}`;
        if (this.cache.has(cacheKey)) {
            if (this.debug) {
                console.log('CSS Class Navigator: Using cached definitions for:', className);
            }
            return this.cache.get(cacheKey);
        }
        const definitions = [];
        const cssFiles = await this.findCSSFiles(document);
        if (this.debug) {
            console.log('CSS Class Navigator: Found CSS files:', cssFiles.map(f => f.fsPath));
        }
        for (const cssFile of cssFiles) {
            try {
                const cssDocument = await vscode.workspace.openTextDocument(cssFile);
                const cssDefinitions = this.cssParser.findClassDefinitions(cssDocument, className);
                definitions.push(...cssDefinitions);
                if (this.debug && cssDefinitions.length > 0) {
                    console.log('CSS Class Navigator: Found', cssDefinitions.length, 'definitions in', cssFile.fsPath);
                }
            }
            catch (error) {
                if (this.debug) {
                    console.error('CSS Class Navigator: Error reading CSS file:', cssFile.fsPath, error);
                }
            }
        }
        this.cache.set(cacheKey, definitions);
        return definitions;
    }
    /**
     * Find relevant CSS files for the current document
     */
    async findCSSFiles(document) {
        const cssFiles = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return cssFiles;
        }
        // Find CSS files in workspace
        const cssGlob = '**/*.{css,scss,sass,less,styl}';
        const files = await vscode.workspace.findFiles(cssGlob, '**/node_modules/**');
        if (this.debug) {
            console.log('CSS Class Navigator: Found', files.length, 'CSS files in workspace');
        }
        // Sort files by relevance
        cssFiles.push(...this.fileUtils.sortFilesByRelevance(files, document));
        // Also check for linked CSS in HTML files
        if (document.languageId === 'html') {
            const linkedFiles = this.findLinkedCSSFiles(document);
            cssFiles.unshift(...linkedFiles);
        }
        // Check for imported CSS in JS/JSX files
        if (['javascript', 'javascriptreact', 'typescript', 'typescriptreact'].includes(document.languageId)) {
            const importedFiles = await this.findImportedCSSFiles(document);
            cssFiles.unshift(...importedFiles);
        }
        return [...new Set(cssFiles)]; // Remove duplicates
    }
    /**
     * Find CSS files linked in HTML
     */
    findLinkedCSSFiles(document) {
        const cssFiles = [];
        const text = document.getText();
        const linkRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(text)) !== null) {
            const href = match[1];
            const cssPath = this.fileUtils.resolveRelativePath(document.uri, href);
            if (cssPath) {
                cssFiles.push(cssPath);
            }
        }
        return cssFiles;
    }
    /**
     * Find CSS files imported in JavaScript/TypeScript
     */
    async findImportedCSSFiles(document) {
        const cssFiles = [];
        const text = document.getText();
        const importRegex = /import\s+["']([^"']+\.(?:css|scss|sass|less|styl))["'];?/gi;
        let match;
        while ((match = importRegex.exec(text)) !== null) {
            const importPath = match[1];
            const cssPath = this.fileUtils.resolveRelativePath(document.uri, importPath);
            if (cssPath) {
                cssFiles.push(cssPath);
            }
        }
        return cssFiles;
    }
}
exports.CSSDefinitionProvider = CSSDefinitionProvider;
//# sourceMappingURL=cssDefinitionProvider.js.map