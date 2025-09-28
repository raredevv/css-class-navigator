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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('CSS Class Navigator');
    // Get configuration
    const config = vscode.workspace.getConfiguration('cssClassNavigator');
    const debugEnabled = config.get('debug', false);
    if (debugEnabled) {
        outputChannel.show();
    }
    outputChannel.appendLine('CSS Class Navigator: Improved version activated!');
    const languages = ['html', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue'];
    languages.forEach(language => {
        const provider = vscode.languages.registerDefinitionProvider({ scheme: 'file', language }, {
            async provideDefinition(document, position) {
                if (debugEnabled) {
                    outputChannel.appendLine(`\n=== Definition request for ${language} ===`);
                }
                const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
                if (!wordRange) {
                    return undefined;
                }
                const word = document.getText(wordRange);
                const line = document.lineAt(position).text;
                // Check if it's a CSS class or ID
                const context = getContext(line, wordRange);
                if (!context.isValid) {
                    return undefined;
                }
                if (debugEnabled) {
                    outputChannel.appendLine(`Searching for ${context.type}: "${word}"`);
                }
                // Find CSS files and search for the class/ID
                const definitions = await findDefinitions(word, context.type, document, outputChannel, debugEnabled);
                if (definitions.length > 0) {
                    if (debugEnabled) {
                        outputChannel.appendLine(`Found ${definitions.length} definition(s)`);
                    }
                    return definitions;
                }
                else {
                    // Show user-friendly message when nothing is found
                    const message = context.type === 'class'
                        ? `CSS class ".${word}" not found in workspace`
                        : `CSS ID "#${word}" not found in workspace`;
                    vscode.window.showInformationMessage(message);
                    if (debugEnabled) {
                        outputChannel.appendLine('No definitions found');
                    }
                    return undefined;
                }
            }
        });
        context.subscriptions.push(provider);
    });
    // Register configuration change handler
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('cssClassNavigator.debug')) {
            const newDebugSetting = vscode.workspace.getConfiguration('cssClassNavigator').get('debug', false);
            if (newDebugSetting) {
                outputChannel.show();
                outputChannel.appendLine('Debug mode enabled');
            }
        }
    });
    context.subscriptions.push(configChangeDisposable);
}
function getContext(line, wordRange) {
    const wordStart = wordRange.start.character;
    const beforeWord = line.substring(0, wordStart);
    const charBefore = wordStart > 0 ? line.charAt(wordStart - 1) : '';
    // CSS selector (.class-name or #id-name)
    if (charBefore === '.') {
        return { isValid: true, type: 'class' };
    }
    if (charBefore === '#') {
        return { isValid: true, type: 'id' };
    }
    // class="..." or className="..." patterns
    const classPatterns = [
        /class\s*=\s*["'][^"']*$/i,
        /className\s*=\s*["'][^"']*$/i,
        /class\s*=\s*{[^}]*$/i,
        /className\s*=\s*{[^}]*$/i
    ];
    if (classPatterns.some(pattern => pattern.test(beforeWord))) {
        return { isValid: true, type: 'class' };
    }
    // id="..." patterns
    const idPatterns = [
        /id\s*=\s*["'][^"']*$/i,
        /id\s*=\s*{[^}]*$/i
    ];
    if (idPatterns.some(pattern => pattern.test(beforeWord))) {
        return { isValid: true, type: 'id' };
    }
    return { isValid: false, type: 'class' };
}
async function findDefinitions(name, type, document, outputChannel, debugEnabled) {
    const definitions = [];
    try {
        // Get workspace folder
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            if (debugEnabled) {
                outputChannel.appendLine('No workspace folder found');
            }
            return definitions;
        }
        // Find CSS files (including built CSS files)
        const cssPattern = '**/*.{css,scss,sass,less,styl}';
        const cssFiles = await vscode.workspace.findFiles(cssPattern, '**/node_modules/**', 100);
        // Also look in common build directories
        const buildCssPattern = '**/dist/**/*.css';
        const buildFiles = await vscode.workspace.findFiles(buildCssPattern, undefined, 50);
        const allCssFiles = [...cssFiles, ...buildFiles];
        if (debugEnabled) {
            outputChannel.appendLine(`Found ${allCssFiles.length} CSS files to search`);
        }
        for (const cssFile of allCssFiles) {
            if (debugEnabled) {
                outputChannel.appendLine(`Searching in: ${cssFile.fsPath}`);
            }
            try {
                const cssDocument = await vscode.workspace.openTextDocument(cssFile);
                const cssDefinitions = await searchInDocument(cssDocument, name, type, outputChannel, debugEnabled);
                definitions.push(...cssDefinitions);
            }
            catch (error) {
                if (debugEnabled) {
                    outputChannel.appendLine(`Error reading ${cssFile.fsPath}: ${error}`);
                }
            }
        }
        // Also search in <style> tags within HTML documents
        if (document.languageId === 'html') {
            if (debugEnabled) {
                outputChannel.appendLine('Searching for inline styles in HTML document');
            }
            const inlineDefinitions = await searchInlineStyles(document, name, type, outputChannel, debugEnabled);
            definitions.push(...inlineDefinitions);
        }
    }
    catch (error) {
        if (debugEnabled) {
            outputChannel.appendLine(`Error finding CSS files: ${error}`);
        }
    }
    return definitions;
}
async function searchInDocument(cssDocument, name, type, outputChannel, debugEnabled) {
    const definitions = [];
    const text = cssDocument.getText();
    const lines = text.split('\n');
    const prefix = type === 'class' ? '\\.' : '#';
    const regex = new RegExp(`${prefix}${escapeRegExp(name)}(?=[\\s\\.:,{>#\\[]|$)`, 'gi');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match;
        while ((match = regex.exec(line)) !== null) {
            const startPos = match.index;
            const endPos = startPos + match[0].length;
            // Create location pointing to the name (skip the prefix)
            const position = new vscode.Position(lineIndex, startPos + 1);
            const range = new vscode.Range(position, new vscode.Position(lineIndex, endPos));
            const location = new vscode.Location(cssDocument.uri, range);
            definitions.push(location);
            if (debugEnabled) {
                outputChannel.appendLine(`Found definition at line ${lineIndex + 1}: ${line.trim()}`);
            }
        }
        // Reset regex lastIndex for next line
        regex.lastIndex = 0;
    }
    return definitions;
}
async function searchInlineStyles(htmlDocument, name, type, outputChannel, debugEnabled) {
    const definitions = [];
    const text = htmlDocument.getText();
    const lines = text.split('\n');
    let inStyleTag = false;
    const prefix = type === 'class' ? '\\.' : '#';
    const regex = new RegExp(`${prefix}${escapeRegExp(name)}(?=[\\s\\.:,{>#\\[]|$)`, 'gi');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Check if we're entering or leaving a <style> tag
        if (line.includes('<style')) {
            inStyleTag = true;
        }
        if (line.includes('</style>')) {
            inStyleTag = false;
            continue;
        }
        // Only search within <style> tags
        if (!inStyleTag) {
            continue;
        }
        let match;
        while ((match = regex.exec(line)) !== null) {
            const startPos = match.index;
            const endPos = startPos + match[0].length;
            // Create location pointing to the name (skip the prefix)
            const position = new vscode.Position(lineIndex, startPos + 1);
            const range = new vscode.Range(position, new vscode.Position(lineIndex, endPos));
            const location = new vscode.Location(htmlDocument.uri, range);
            definitions.push(location);
            if (debugEnabled) {
                outputChannel.appendLine(`Found inline definition at line ${lineIndex + 1}: ${line.trim()}`);
            }
        }
        // Reset regex lastIndex for next line
        regex.lastIndex = 0;
    }
    return definitions;
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function deactivate() {
    console.log('CSS Class Navigator: Extension deactivated');
}
//# sourceMappingURL=extension.js.map