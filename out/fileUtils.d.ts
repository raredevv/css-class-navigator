import * as vscode from 'vscode';
export declare class FileUtils {
    /**
     * Resolve a relative path from a document URI
     */
    resolveRelativePath(documentUri: vscode.Uri, relativePath: string): vscode.Uri | undefined;
    /**
     * Check if a file exists
     */
    fileExists(uri: vscode.Uri): Promise<boolean>;
    /**
     * Get all CSS files in workspace
     */
    findCSSFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]>;
    /**
     * Find CSS files that might be related to the given document
     */
    findRelatedCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]>;
    /**
     * Read file content as string
     */
    readFileContent(uri: vscode.Uri): Promise<string>;
    /**
     * Get relative path from one URI to another
     */
    getRelativePath(from: vscode.Uri, to: vscode.Uri): string;
    /**
     * Normalize path separators
     */
    normalizePath(filePath: string): string;
    /**
     * Check if path is within workspace
     */
    isInWorkspace(uri: vscode.Uri): boolean;
    /**
     * Get workspace folder for a URI
     */
    getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined;
    /**
     * Parse import statements from JavaScript/TypeScript files
     */
    parseImportStatements(content: string): string[];
    /**
     * Parse link tags from HTML files
     */
    parseLinkTags(content: string): string[];
    /**
     * Check if a file path refers to a CSS file
     */
    isCSSFile(filePath: string): boolean;
    /**
     * Check if a file is a supported source file
     */
    isSupportedSourceFile(filePath: string): boolean;
    /**
     * Get file extension
     */
    getFileExtension(filePath: string): string;
    /**
     * Get file name without extension
     */
    getFileNameWithoutExtension(filePath: string): string;
    /**
     * Resolve glob patterns for file searching
     */
    createGlobPattern(extensions: string[]): string;
    /**
     * Check if file is in node_modules or other excluded directories
     */
    shouldExcludeFile(uri: vscode.Uri): boolean;
    /**
     * Get directory depth relative to workspace
     */
    getDirectoryDepth(uri: vscode.Uri): number;
    /**
     * Sort files by relevance to the source document
     */
    sortFilesByRelevance(files: vscode.Uri[], sourceDocument: vscode.TextDocument): vscode.Uri[];
    /**
     * Calculate relevance score for a CSS file relative to source
     */
    private calculateRelevanceScore;
}
//# sourceMappingURL=fileUtils.d.ts.map