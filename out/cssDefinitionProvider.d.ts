import * as vscode from 'vscode';
export declare class CSSDefinitionProvider implements vscode.DefinitionProvider {
    private cssParser;
    private fileUtils;
    private cache;
    private enabled;
    private debug;
    constructor();
    /**
     * Update configuration from VS Code settings
     */
    updateConfiguration(): void;
    /**
     * Clear the definition cache
     */
    clearCache(): void;
    /**
     * Dispose of resources
     */
    dispose(): void;
    /**
     * Provide definitions for CSS classes
     */
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | undefined>;
    /**
     * Extract CSS class name at the given position
     */
    private extractClassName;
    /**
     * Check if the word is in a CSS class context
     */
    private isClassContext;
    /**
     * Find all definitions for a CSS class
     */
    private findDefinitions;
    /**
     * Find relevant CSS files for the current document
     */
    private findCSSFiles;
    /**
     * Find CSS files linked in HTML
     */
    private findLinkedCSSFiles;
    /**
     * Find CSS files imported in JavaScript/TypeScript
     */
    private findImportedCSSFiles;
}
//# sourceMappingURL=cssDefinitionProvider.d.ts.map