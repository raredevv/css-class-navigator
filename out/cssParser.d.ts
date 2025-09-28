import * as vscode from 'vscode';
interface CSSDefinition {
    className: string;
    location: vscode.Location;
    selector: string;
}
export declare class CSSParser {
    /**
     * Find all class definitions in a CSS document
     */
    findClassDefinitions(document: vscode.TextDocument, className: string): CSSDefinition[];
    /**
     * Find class matches in a single line
     */
    private findClassesInLine;
    /**
     * Remove CSS comments from a line
     */
    private removeComments;
    /**
     * Extract the full CSS selector from a line
     */
    private extractFullSelector;
    /**
     * Parse CSS and extract all class names
     */
    extractAllClasses(cssText: string): Set<string>;
    /**
     * Remove all CSS comments from text
     */
    private removeAllComments;
    /**
     * Check if a line contains a CSS rule
     */
    isRuleLine(line: string): boolean;
    /**
     * Parse SCSS/Sass nested selectors
     */
    parseNestedSelectors(text: string): Map<string, vscode.Position[]>;
    /**
     * Get the current selector context at a given position
     */
    getSelectorContext(document: vscode.TextDocument, position: vscode.Position): string;
}
export {};
//# sourceMappingURL=cssParser.d.ts.map