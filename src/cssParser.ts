import * as vscode from 'vscode';

interface CSSDefinition {
    className: string;
    location: vscode.Location;
    selector: string;
}

export class CSSParser {
    private outputChannel: vscode.OutputChannel;
    private debug: boolean = false;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.updateConfiguration();
    }

    /**
     * Update configuration from VS Code settings
     */
    public updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('goToStyle');
        this.debug = config.get('debug', false);
    }

    /**
     * Find CSS class definitions in a document
     */
    public findClassDefinitions(document: vscode.TextDocument, className: string): CSSDefinition[] {
        const definitions: CSSDefinition[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Searching for class "${className}" in ${document.uri.fsPath}`);
        }

        // Create regex pattern for CSS class selectors
        const classRegex = new RegExp(`\\.${this.escapeRegExp(className)}(?=[\\s\\.:,{>#\\[\\)]|$)`, 'gi');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let match;

            while ((match = classRegex.exec(line)) !== null) {
                const startPos = match.index + 1; // Skip the dot
                const endPos = startPos + className.length;

                const position = new vscode.Position(lineIndex, startPos);
                const range = new vscode.Range(
                    position,
                    new vscode.Position(lineIndex, endPos)
                );

                const location = new vscode.Location(document.uri, range);
                const fullSelector = this.extractFullSelector(lines, lineIndex, match.index);

                definitions.push({
                    className,
                    location,
                    selector: fullSelector
                });

                if (this.debug) {
                    this.outputChannel.appendLine(`CSS Parser: Found definition at line ${lineIndex + 1}: ${line.trim()}`);
                }
            }

            // Reset regex lastIndex for next line
            classRegex.lastIndex = 0;
        }

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Found ${definitions.length} definitions for "${className}"`);
        }

        return definitions;
    }

    /**
     * Find CSS ID definitions in a document
     */
    public findIdDefinitions(document: vscode.TextDocument, idName: string): CSSDefinition[] {
        const definitions: CSSDefinition[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Searching for ID "${idName}" in ${document.uri.fsPath}`);
        }

        // Create regex pattern for CSS ID selectors
        const idRegex = new RegExp(`#${this.escapeRegExp(idName)}(?=[\\s\\.:,{>#\\[\\)]|$)`, 'gi');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let match;

            while ((match = idRegex.exec(line)) !== null) {
                const startPos = match.index + 1; // Skip the hash
                const endPos = startPos + idName.length;

                const position = new vscode.Position(lineIndex, startPos);
                const range = new vscode.Range(
                    position,
                    new vscode.Position(lineIndex, endPos)
                );

                const location = new vscode.Location(document.uri, range);
                const fullSelector = this.extractFullSelector(lines, lineIndex, match.index);

                definitions.push({
                    className: idName, // Using className field for consistency
                    location,
                    selector: fullSelector
                });

                if (this.debug) {
                    this.outputChannel.appendLine(`CSS Parser: Found ID definition at line ${lineIndex + 1}: ${line.trim()}`);
                }
            }

            // Reset regex lastIndex for next line
            idRegex.lastIndex = 0;
        }

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Found ${definitions.length} definitions for ID "${idName}"`);
        }

        return definitions;
    }

    /**
     * Parse CSS and extract all class names
     */
    public extractAllClassNames(document: vscode.TextDocument): string[] {
        const classNames: Set<string> = new Set();
        const text = document.getText();
        
        // Regex to match CSS class selectors
        const classRegex = /\.([a-zA-Z0-9_-]+)(?=[\\s\\.:,{>#\\[\\)]|$)/g;
        let match;

        while ((match = classRegex.exec(text)) !== null) {
            classNames.add(match[1]);
        }

        const result = Array.from(classNames);

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Extracted ${result.length} unique class names from ${document.uri.fsPath}`);
        }

        return result;
    }

    /**
     * Parse CSS and extract all ID names
     */
    public extractAllIdNames(document: vscode.TextDocument): string[] {
        const idNames: Set<string> = new Set();
        const text = document.getText();
        
        // Regex to match CSS ID selectors
        const idRegex = /#([a-zA-Z0-9_-]+)(?=[\s\.:,{>#\[\)]|$)/g;
        let match;

        while ((match = idRegex.exec(text)) !== null) {
            idNames.add(match[1]);
        }

        const result = Array.from(idNames);

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Extracted ${result.length} unique ID names from ${document.uri.fsPath}`);
        }

        return result;
    }

    /**
     * Check if a selector is valid CSS
     */
    public isValidCSSSelector(selector: string): boolean {
        // Basic validation for CSS selectors
        const validPatterns = [
            /^\.[\w-]+/, // Class selector
            /^#[\w-]+/,  // ID selector
            /^[\w-]+$/,  // Element selector
            /^[\w-]+:/, // Pseudo-class
            /^\[[\w-]+/ // Attribute selector
        ];

        return validPatterns.some(pattern => pattern.test(selector.trim()));
    }

    /**
     * Extract the full CSS selector from surrounding context
     */
    private extractFullSelector(lines: string[], lineIndex: number, matchIndex: number): string {
        const currentLine = lines[lineIndex];
        let selector = currentLine.trim();

        // Look for multi-line selectors
        let i = lineIndex - 1;
        while (i >= 0) {
            const prevLine = lines[i].trim();
            if (prevLine.endsWith(',')) {
                selector = prevLine + ' ' + selector;
                i--;
            } else if (prevLine.length > 0 && !prevLine.endsWith('{') && !prevLine.endsWith('}')) {
                selector = prevLine + ' ' + selector;
                break;
            } else {
                break;
            }
        }

        // Clean up the selector
        selector = selector.replace(/\s+/g, ' ').trim();
        
        // Remove any trailing opening brace
        selector = selector.replace(/\s*{\s*$/, '');

        return selector;
    }

    /**
     * Escape special regex characters
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\        const result = Array');
    }

    /**
     * Parse SCSS/SASS nested selectors
     */
    public findNestedClassDefinitions(document: vscode.TextDocument, className: string): CSSDefinition[] {
        const definitions: CSSDefinition[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Searching for nested class "${className}" in ${document.uri.fsPath}`);
        }

        // Handle nested selectors (SCSS/SASS)
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex].trim();
            
            // Look for nested class references
            if (line.includes(`&.${className}`) || line.includes(`.${className}`)) {
                const match = line.match(new RegExp(`[&.]${this.escapeRegExp(className)}`));
                if (match) {
                    const matchIndex = line.indexOf(match[0]);
                    const startPos = matchIndex + (match[0].startsWith('&') ? 2 : 1); // Skip & and . or just .
                    const endPos = startPos + className.length;

                    const position = new vscode.Position(lineIndex, startPos);
                    const range = new vscode.Range(
                        position,
                        new vscode.Position(lineIndex, endPos)
                    );

                    const location = new vscode.Location(document.uri, range);
                    const fullSelector = this.extractNestedSelector(lines, lineIndex);

                    definitions.push({
                        className,
                        location,
                        selector: fullSelector
                    });

                    if (this.debug) {
                        this.outputChannel.appendLine(`CSS Parser: Found nested definition at line ${lineIndex + 1}: ${line}`);
                    }
                }
            }
        }

        return definitions;
    }

    /**
     * Extract nested selector context for SCSS/SASS
     */
    private extractNestedSelector(lines: string[], lineIndex: number): string {
        const parts: string[] = [];
        let currentIndent = this.getIndentation(lines[lineIndex]);
        
        // Add current line
        parts.unshift(lines[lineIndex].trim());
        
        // Walk up to find parent selectors
        for (let i = lineIndex - 1; i >= 0; i--) {
            const line = lines[i].trim();
            const indent = this.getIndentation(lines[i]);
            
            if (indent < currentIndent && line.length > 0 && !line.startsWith('//')) {
                if (line.endsWith('{')) {
                    const selector = line.replace(/\s*{\s*$/, '').trim();
                    parts.unshift(selector);
                    currentIndent = indent;
                } else if (line.includes(':') && !line.includes('{')) {
                    // Skip property declarations
                    continue;
                }
                
                if (indent === 0) break;
            }
        }
        
        return parts.join(' ');
    }

    /**
     * Get line indentation level
     */
    private getIndentation(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Find CSS custom properties (CSS variables)
     */
    public findCSSVariables(document: vscode.TextDocument): string[] {
        const variables: Set<string> = new Set();
        const text = document.getText();
        
        // Match CSS custom properties
        const variableRegex = /--([\w-]+)/g;
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            variables.add(match[1]);
        }

        const result = Array.from(variables);

        if (this.debug) {
            this.outputChannel.appendLine(`CSS Parser: Found ${result.length} CSS variables in ${document.uri.fsPath}`);
        }

        return result;
    }

    /**
     * Check if document contains CSS-in-JS patterns
     */
    public hasCSSInJS(document: vscode.TextDocument): boolean {
        const text = document.getText();
        const cssInJSPatterns = [
            /styled\./,
            /css`/,
            /styled\(/,
            /makeStyles/,
            /createStyles/,
            /useStyles/
        ];

        const hasCSSInJS = cssInJSPatterns.some(pattern => pattern.test(text));

        if (this.debug && hasCSSInJS) {
            this.outputChannel.appendLine(`CSS Parser: Detected CSS-in-JS patterns in ${document.uri.fsPath}`);
        }

        return hasCSSInJS;
    }
}