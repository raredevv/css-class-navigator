import * as vscode from 'vscode';
// import * as path from 'path';
import { CSSParser } from './cssParser';
import { FileUtils } from './fileUtils';

interface CSSDefinition {
    className: string;
    location: vscode.Location;
    selector: string;
}

export class CSSDefinitionProvider implements vscode.DefinitionProvider {
    private cssParser: CSSParser;
    private fileUtils: FileUtils;
    private cache: Map<string, CSSDefinition[]> = new Map();
    private enabled: boolean = true;
    private debug: boolean = false;
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.cssParser = new CSSParser(outputChannel);
        this.fileUtils = new FileUtils(outputChannel);
        this.outputChannel = outputChannel;
        this.updateConfiguration();
    }

    /**
     * Update configuration from VS Code settings
     */
    public updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('goToStyle');
        this.enabled = config.get('enabled', true);
        this.debug = config.get('debug', false);

        if (this.debug) {
            this.outputChannel.appendLine('CSS Definition Provider: Configuration updated');
            this.outputChannel.appendLine(`Enabled: ${this.enabled}, Debug: ${this.debug}`);
        }
    }

    /**
     * Clear the definition cache
     */
    public clearCache(): void {
        this.cache.clear();
        if (this.debug) {
            this.outputChannel.appendLine('CSS Definition Provider: Cache cleared');
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.cache.clear();
    }

    /**
     * Provide definitions for CSS classes
     */
    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        if (this.debug) {
            this.outputChannel.appendLine(`CSS Definition Provider: Request for ${document.uri.fsPath} at position ${position.line}:${position.character}`);
        }

        if (!this.enabled) {
            if (this.debug) {
                this.outputChannel.appendLine('CSS Definition Provider: Extension disabled');
            }
            return undefined;
        }

        try {
            const className = this.extractClassName(document, position);
            if (!className) {
                if (this.debug) {
                    this.outputChannel.appendLine('CSS Definition Provider: No class name found at position');
                }
                return undefined;
            }

            if (this.debug) {
                this.outputChannel.appendLine(`CSS Definition Provider: Looking for class: ${className}`);
            }

            const definitions = await this.findDefinitions(className, document);

            if (definitions.length === 0) {
                if (this.debug) {
                    this.outputChannel.appendLine(`CSS Definition Provider: No definitions found for: ${className}`);
                }
                return undefined;
            }

            if (this.debug) {
                this.outputChannel.appendLine(`CSS Definition Provider: Found ${definitions.length} definitions`);
            }

            return definitions.map(def => def.location);
        } catch (error) {
            this.outputChannel.appendLine(`CSS Definition Provider: Error providing definition: ${error}`);
            return undefined;
        }
    }

    /**
     * Extract CSS class name at the given position
     */
    private extractClassName(document: vscode.TextDocument, position: vscode.Position): string | undefined {
        // Get a larger word range that includes common CSS class characters
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
        if (!wordRange) {
            if (this.debug) {
                this.outputChannel.appendLine('CSS Definition Provider: No word range found');
            }
            return undefined;
        }

        const word = document.getText(wordRange);
        const line = document.lineAt(position).text;

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Definition Provider: Word found: "${word}", Line: "${line}"`);
        }

        // Check if this looks like a CSS class based on context
        if (this.isClassContext(document, position, wordRange)) {
            return word;
        }

        if (this.debug) {
            this.outputChannel.appendLine('CSS Definition Provider: Word not in class context');
        }
        return undefined;
    }

    /**
     * Check if the word is in a CSS class context
     */
    private isClassContext(document: vscode.TextDocument, position: vscode.Position, wordRange: vscode.Range): boolean {
        const line = document.lineAt(position).text;
        const charBefore = wordRange.start.character > 0 ? 
            line.charAt(wordRange.start.character - 1) : '';
        const charsBefore = wordRange.start.character > 10 ? 
            line.substring(wordRange.start.character - 10, wordRange.start.character) : 
            line.substring(0, wordRange.start.character);

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Definition Provider: Context check - charBefore: "${charBefore}", charsBefore: "${charsBefore}"`);
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
    private async findDefinitions(className: string, document: vscode.TextDocument): Promise<CSSDefinition[]> {
        const cacheKey = `${className}-${document.uri.fsPath}`;

        if (this.cache.has(cacheKey)) {
            if (this.debug) {
                this.outputChannel.appendLine(`CSS Definition Provider: Using cached definitions for: ${className}`);
            }
            return this.cache.get(cacheKey)!;
        }

        const definitions: CSSDefinition[] = [];
        const cssFiles = await this.findCSSFiles(document);

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Definition Provider: Found ${cssFiles.length} CSS files`);
            cssFiles.forEach(file => this.outputChannel.appendLine(`  - ${file.fsPath}`));
        }

        for (const cssFile of cssFiles) {
            try {
                const cssDocument = await vscode.workspace.openTextDocument(cssFile);
                const cssDefinitions = this.cssParser.findClassDefinitions(cssDocument, className);
                definitions.push(...cssDefinitions);
                
                if (this.debug && cssDefinitions.length > 0) {
                    this.outputChannel.appendLine(`CSS Definition Provider: Found ${cssDefinitions.length} definitions in ${cssFile.fsPath}`);
                }
            } catch (error) {
                if (this.debug) {
                    this.outputChannel.appendLine(`CSS Definition Provider: Error reading CSS file ${cssFile.fsPath}: ${error}`);
                }
            }
        }

        this.cache.set(cacheKey, definitions);
        return definitions;
    }

    /**
     * Find relevant CSS files for the current document
     */
    private async findCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]> {
        const cssFiles: vscode.Uri[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

        if (!workspaceFolder) {
            return cssFiles;
        }

        // Find CSS files in workspace
        const cssGlob = '**/*.{css,scss,sass,less,styl}';
        const files = await vscode.workspace.findFiles(cssGlob, '**/node_modules/**');

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Definition Provider: Found ${files.length} CSS files in workspace`);
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
    private findLinkedCSSFiles(document: vscode.TextDocument): vscode.Uri[] {
        const cssFiles: vscode.Uri[] = [];
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

        if (this.debug && cssFiles.length > 0) {
            this.outputChannel.appendLine(`CSS Definition Provider: Found ${cssFiles.length} linked CSS files`);
        }

        return cssFiles;
    }

    /**
     * Find CSS files imported in JavaScript/TypeScript
     */
    private async findImportedCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]> {
        const cssFiles: vscode.Uri[] = [];
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

        if (this.debug && cssFiles.length > 0) {
            this.outputChannel.appendLine(`CSS Definition Provider: Found ${cssFiles.length} imported CSS files`);
        }

        return cssFiles;
    }
}