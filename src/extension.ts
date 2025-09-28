import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('CSS Class Navigator');
    
    // Get configuration
    const config = vscode.workspace.getConfiguration('cssClassNavigator');
    const debugEnabled = config.get<boolean>('debug', false);
    
    if (debugEnabled) {
        outputChannel.show();
    }
    outputChannel.appendLine('CSS Class Navigator: Improved version activated!');
    
    const languages = ['html', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue'];
    
    languages.forEach(language => {
        const provider = vscode.languages.registerDefinitionProvider(
            { scheme: 'file', language },
            {
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
                    } else {
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
            }
        );
        context.subscriptions.push(provider);
    });

    // Register configuration change handler
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('cssClassNavigator.debug')) {
            const newDebugSetting = vscode.workspace.getConfiguration('cssClassNavigator').get<boolean>('debug', false);
            if (newDebugSetting) {
                outputChannel.show();
                outputChannel.appendLine('Debug mode enabled');
            }
        }
    });
    context.subscriptions.push(configChangeDisposable);
}

interface ContextResult {
    isValid: boolean;
    type: 'class' | 'id';
}

function getContext(line: string, wordRange: vscode.Range): ContextResult {
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

async function findDefinitions(
    name: string, 
    type: 'class' | 'id', 
    document: vscode.TextDocument, 
    outputChannel: vscode.OutputChannel, 
    debugEnabled: boolean
): Promise<vscode.Location[]> {
    const definitions: vscode.Location[] = [];
    
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
            } catch (error) {
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
        
    } catch (error) {
        if (debugEnabled) {
            outputChannel.appendLine(`Error finding CSS files: ${error}`);
        }
    }
    
    return definitions;
}

async function searchInDocument(
    cssDocument: vscode.TextDocument, 
    name: string, 
    type: 'class' | 'id', 
    outputChannel: vscode.OutputChannel, 
    debugEnabled: boolean
): Promise<vscode.Location[]> {
    const definitions: vscode.Location[] = [];
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
            const range = new vscode.Range(
                position,
                new vscode.Position(lineIndex, endPos)
            );
            
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

async function searchInlineStyles(
    htmlDocument: vscode.TextDocument, 
    name: string, 
    type: 'class' | 'id', 
    outputChannel: vscode.OutputChannel, 
    debugEnabled: boolean
): Promise<vscode.Location[]> {
    const definitions: vscode.Location[] = [];
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
            const range = new vscode.Range(
                position,
                new vscode.Position(lineIndex, endPos)
            );
            
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

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function deactivate() {
    console.log('CSS Class Navigator: Extension deactivated');
}