import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('CSS Class Navigator');
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);
    
    // Get configuration
    const config = vscode.workspace.getConfiguration('goToStyle');
    const debugEnabled = config.get<boolean>('debug', false);
    
    if (debugEnabled) {
        outputChannel.show();
    }
    outputChannel.appendLine('CSS Class Navigator: Enhanced version activated!');
    
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
                    
                    // Enhanced context detection
                    const context = getEnhancedContext(line, wordRange, document);
                    if (!context.isValid) {
                        return undefined;
                    }
                    
                    if (debugEnabled) {
                        outputChannel.appendLine(`Searching for ${context.type}: "${word}" (Framework: ${context.framework})`);
                    }
                    
                    // Update status bar
                    statusBarItem.text = `$(search) Finding CSS...`;
                    statusBarItem.show();
                    
                    // Find CSS files and search for the class/ID
                    const definitions = await findDefinitionsEnhanced(word, context.type, document, outputChannel, debugEnabled);
                    
                    // Update status bar with results
                    if (definitions.length > 0) {
                        statusBarItem.text = `$(check) Found ${definitions.length} CSS match${definitions.length > 1 ? 'es' : ''}`;
                        setTimeout(() => statusBarItem.hide(), 3000);
                        
                        if (debugEnabled) {
                            outputChannel.appendLine(`Found ${definitions.length} definition(s)`);
                        }
                        return definitions;
                    } else {
                        statusBarItem.text = `$(x) CSS not found`;
                        setTimeout(() => statusBarItem.hide(), 3000);
                        
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

    // Register command for context menu
    const goToDefinitionCommand = vscode.commands.registerCommand('goToStyle.findDefinition', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const position = editor.selection.active;
        const wordRange = editor.document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
        
        if (!wordRange) {
            vscode.window.showWarningMessage('No CSS class or ID found at cursor position');
            return;
        }

        const word = editor.document.getText(wordRange);
        const line = editor.document.lineAt(position).text;
        const context = getEnhancedContext(line, wordRange, editor.document);
        
        if (!context.isValid) {
            vscode.window.showWarningMessage('Cursor is not on a CSS class or ID');
            return;
        }

        statusBarItem.text = `$(search) Finding CSS...`;
        statusBarItem.show();

        const definitions = await findDefinitionsEnhanced(word, context.type, editor.document, outputChannel, debugEnabled);
        
        if (definitions.length > 0) {
            statusBarItem.text = `$(check) Found ${definitions.length} CSS match${definitions.length > 1 ? 'es' : ''}`;
            setTimeout(() => statusBarItem.hide(), 3000);
            
            if (definitions.length === 1) {
                // Jump directly to single definition
                const definition = definitions[0];
                await vscode.window.showTextDocument(definition.uri, { 
                    selection: definition.range 
                });
            } else {
                // Show QuickPick for multiple definitions
                const picks = definitions.map(def => ({
                    label: `$(symbol-class) ${path.basename(def.uri.fsPath)}`,
                    description: `Line ${def.range.start.line + 1}`,
                    detail: def.uri.fsPath,
                    definition: def
                }));

                const selected = await vscode.window.showQuickPick(picks, {
                    placeHolder: `Found ${definitions.length} definitions for "${word}"`
                });

                if (selected) {
                    await vscode.window.showTextDocument(selected.definition.uri, { 
                        selection: selected.definition.range 
                    });
                }
            }
        } else {
            statusBarItem.text = `$(x) CSS not found`;
            setTimeout(() => statusBarItem.hide(), 3000);
            
            const message = context.type === 'class' 
                ? `CSS class ".${word}" not found in workspace`
                : `CSS ID "#${word}" not found in workspace`;
            vscode.window.showWarningMessage(message);
        }
    });
    context.subscriptions.push(goToDefinitionCommand);

    // Register configuration change handler
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('goToStyle.debug')) {
            const newDebugSetting = vscode.workspace.getConfiguration('goToStyle').get<boolean>('debug', false);
            if (newDebugSetting) {
                outputChannel.show();
                outputChannel.appendLine('Debug mode enabled');
            }
        }
    });
    context.subscriptions.push(configChangeDisposable);
}

interface EnhancedContextResult {
    isValid: boolean;
    type: 'class' | 'id';
    framework: 'html' | 'react' | 'vue' | 'angular' | 'unknown';
}

function getEnhancedContext(line: string, wordRange: vscode.Range, document: vscode.TextDocument): EnhancedContextResult {
    const wordStart = wordRange.start.character;
    const beforeWord = line.substring(0, wordStart);
    const charBefore = wordStart > 0 ? line.charAt(wordStart - 1) : '';
    
    // Framework detection
    const framework = detectFramework(document);
    
    // CSS selector (.class-name or #id-name)
    if (charBefore === '.') {
        return { isValid: true, type: 'class', framework };
    }
    if (charBefore === '#') {
        return { isValid: true, type: 'id', framework };
    }
    
    // Enhanced patterns for different frameworks
    const classPatterns = [
        // Standard HTML
        /class\s*=\s*["'][^"']*$/i,
        // React/JSX
        /className\s*=\s*["'][^"']*$/i,
        // JSX with template literals
        /className\s*=\s*{`[^`]*$/i,
        // Vue class binding
        /:class\s*=\s*["'][^"']*$/i,
        /v-bind:class\s*=\s*["'][^"']*$/i,
        // Angular class binding
        /\[class\]\s*=\s*["'][^"']*$/i,
        /\[ngClass\]\s*=\s*["'][^"']*$/i,
        // Template literals in JS/TS
        /`[^`]*$/,
        // Object notation in JSX
        /className\s*=\s*{[^}]*$/i,
        /class\s*=\s*{[^}]*$/i
    ];
    
    if (classPatterns.some(pattern => pattern.test(beforeWord))) {
        return { isValid: true, type: 'class', framework };
    }
    
    // ID patterns
    const idPatterns = [
        /id\s*=\s*["'][^"']*$/i,
        /id\s*=\s*{[^}]*$/i,
        // Angular ID binding
        /\[id\]\s*=\s*["'][^"']*$/i
    ];
    
    if (idPatterns.some(pattern => pattern.test(beforeWord))) {
        return { isValid: true, type: 'id', framework };
    }
    
    // Check for multi-class contexts (space-separated classes)
    if (/class(?:Name)?\s*=\s*["'][^"']*\s/.test(beforeWord) && /\s$/.test(beforeWord)) {
        return { isValid: true, type: 'class', framework };
    }
    
    // Styled-components or CSS-in-JS patterns
    if (line.includes('styled.') || line.includes('css`') || line.includes('styled(')) {
        return { isValid: true, type: 'class', framework: 'react' };
    }
    
    return { isValid: false, type: 'class', framework };
}

function detectFramework(document: vscode.TextDocument): 'html' | 'react' | 'vue' | 'angular' | 'unknown' {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
        return 'unknown';
    }

    try {
        // Check package.json for dependencies
        const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (deps.react || deps['@types/react']) {
                return 'react';
            }
            if (deps.vue || deps['@vue/cli']) {
                return 'vue';
            }
            if (deps['@angular/core'] || deps['@angular/cli']) {
                return 'angular';
            }
        }
    } catch (error) {
        // Fallback to file-based detection
    }

    // Fallback: detect by file extension and content
    const fileName = document.fileName.toLowerCase();
    const content = document.getText();

    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx') || content.includes('className=')) {
        return 'react';
    }
    if (fileName.endsWith('.vue') || content.includes('v-bind') || content.includes(':class')) {
        return 'vue';
    }
    if (content.includes('[ngClass]') || content.includes('*ngFor')) {
        return 'angular';
    }
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        return 'html';
    }

    return 'unknown';
}

async function findDefinitionsEnhanced(
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

        // Get workspace-specific configuration
        const config = vscode.workspace.getConfiguration('goToStyle');
        const searchInNodeModules = config.get<boolean>('searchInNodeModules', false);
        const additionalSearchPaths = config.get<string[]>('additionalSearchPaths', []);
        
        // Multi-file support: Find CSS files with enhanced detection
        const cssFiles = await findCSSFilesEnhanced(document, searchInNodeModules, additionalSearchPaths);
        
        if (debugEnabled) {
            outputChannel.appendLine(`Found ${cssFiles.length} CSS files to search`);
        }
        
        for (const cssFile of cssFiles) {
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
        if (document.languageId === 'html' || document.languageId === 'vue') {
            if (debugEnabled) {
                outputChannel.appendLine('Searching for inline styles in document');
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

async function findCSSFilesEnhanced(
    document: vscode.TextDocument,
    searchInNodeModules: boolean,
    additionalSearchPaths: string[]
): Promise<vscode.Uri[]> {
    const allCssFiles: vscode.Uri[] = [];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    
    if (!workspaceFolder) {
        return allCssFiles;
    }

    // Standard CSS files pattern
    const cssPattern = '**/*.{css,scss,sass,less,styl}';
    const excludePattern = searchInNodeModules ? undefined : '**/node_modules/**';
    const cssFiles = await vscode.workspace.findFiles(cssPattern, excludePattern, 200);
    
    // Add standard CSS files
    allCssFiles.push(...cssFiles);

    // Multi-file support: Detect imported CSS files
    const importedFiles = await detectImportedCSSFiles(document);
    allCssFiles.push(...importedFiles);

    // Multi-file support: Detect linked CSS files
    const linkedFiles = await detectLinkedCSSFiles(document);
    allCssFiles.push(...linkedFiles);

    // Additional search paths from configuration
    for (const searchPath of additionalSearchPaths) {
        try {
            const additionalFiles = await vscode.workspace.findFiles(searchPath, excludePattern, 50);
            allCssFiles.push(...additionalFiles);
        } catch (error) {
            console.warn(`Error searching additional path ${searchPath}:`, error);
        }
    }

    // Remove duplicates and return
    const uniqueFiles = Array.from(new Set(allCssFiles.map(f => f.fsPath)))
        .map(fsPath => vscode.Uri.file(fsPath));
    
    return uniqueFiles;
}

async function detectImportedCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]> {
    const cssFiles: vscode.Uri[] = [];
    const text = document.getText();
    const documentDir = path.dirname(document.uri.fsPath);
    
    // Various import patterns
    const importPatterns = [
        // Standard ES6 imports
        /import\s+['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]/gi,
        // CSS imports
        /@import\s+['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]/gi,
        // Require statements
        /require\s*\(\s*['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]\s*\)/gi,
        // SCSS/SASS @use
        /@use\s+['"`]([^'"`]+)['"`]/gi
    ];
    
    for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const importPath = match[1];
            
            try {
                let resolvedPath: string;
                
                if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('/')) {
                    // Relative path
                    resolvedPath = path.resolve(documentDir, importPath);
                } else {
                    // Try node_modules
                    resolvedPath = path.resolve(documentDir, 'node_modules', importPath);
                }
                
                // Add common extensions if missing
                const extensions = ['.css', '.scss', '.sass', '.less', '.styl'];
                if (!extensions.some(ext => resolvedPath.endsWith(ext))) {
                    for (const ext of extensions) {
                        const withExt = resolvedPath + ext;
                        if (fs.existsSync(withExt)) {
                            resolvedPath = withExt;
                            break;
                        }
                    }
                }
                
                if (fs.existsSync(resolvedPath)) {
                    cssFiles.push(vscode.Uri.file(resolvedPath));
                }
            } catch (error) {
                // Ignore resolution errors
            }
        }
    }
    
    return cssFiles;
}

async function detectLinkedCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]> {
    const cssFiles: vscode.Uri[] = [];
    
    if (document.languageId !== 'html' && document.languageId !== 'vue') {
        return cssFiles;
    }
    
    const text = document.getText();
    const documentDir = path.dirname(document.uri.fsPath);
    
    // Find <link> tags with CSS files
    const linkRegex = /<link[^>]+href\s*=\s*['"`]([^'"`]+\.css)['"`][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
        const href = match[1];
        
        try {
            let resolvedPath: string;
            
            if (href.startsWith('http://') || href.startsWith('https://')) {
                // Skip external URLs
                continue;
            }
            
            if (href.startsWith('./') || href.startsWith('../') || href.startsWith('/')) {
                resolvedPath = path.resolve(documentDir, href);
            } else {
                resolvedPath = path.resolve(documentDir, href);
            }
            
            if (fs.existsSync(resolvedPath)) {
                cssFiles.push(vscode.Uri.file(resolvedPath));
            }
        } catch (error) {
            // Ignore resolution errors
        }
    }
    
    return cssFiles;
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
    const regex = new RegExp(`${prefix}${escapeRegExp(name)}(?=[\\s\\.:,{>#\\[\\)]|$)`, 'gi');
    
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
    const regex = new RegExp(`${prefix}${escapeRegExp(name)}(?=[\\s\\.:,{>#\\[\\)]|$)`, 'gi');
    
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
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    console.log('CSS Class Navigator: Extension deactivated');
}