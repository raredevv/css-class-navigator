import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileUtils {
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
     * Resolve a relative path from a document URI
     */
    public resolveRelativePath(documentUri: vscode.Uri, relativePath: string): vscode.Uri | undefined {
        try {
            const documentDir = path.dirname(documentUri.fsPath);
            const resolvedPath = path.resolve(documentDir, relativePath);
            
            if (this.debug) {
                this.outputChannel.appendLine(`File Utils: Resolving path "${relativePath}" from "${documentDir}"`);
                this.outputChannel.appendLine(`File Utils: Resolved to "${resolvedPath}", exists: ${fs.existsSync(resolvedPath)}`);
            }
            
            if (fs.existsSync(resolvedPath)) {
                return vscode.Uri.file(resolvedPath);
            }
            return undefined;
        } catch (error) {
            if (this.debug) {
                this.outputChannel.appendLine(`File Utils: Error resolving path "${relativePath}": ${error}`);
            }
            return undefined;
        }
    }

    /**
     * Check if a file exists
     */
    public async fileExists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all CSS files in workspace
     */
    public async findCSSFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
        const cssGlob = '**/*.{css,scss,sass,less,styl}';
        const excludePattern = '**/node_modules/**';

        try {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, cssGlob),
                excludePattern
            );
            
            if (this.debug) {
                this.outputChannel.appendLine(`File Utils: Found ${files.length} CSS files in workspace`);
            }
            
            return files;
        } catch (error) {
            if (this.debug) {
                this.outputChannel.appendLine(`File Utils: Error finding CSS files: ${error}`);
            }
            return [];
        }
    }

    /**
     * Find CSS files that might be related to the given document
     */
    public async findRelatedCSSFiles(document: vscode.TextDocument): Promise<vscode.Uri[]> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return [];
        }

        const allCssFiles = await this.findCSSFiles(workspaceFolder);
        const relatedFiles: vscode.Uri[] = [];

        for (const cssFile of allCssFiles) {
            relatedFiles.push(cssFile);
        }

        return this.sortFilesByRelevance(relatedFiles, document);
    }

    /**
     * Read file content as string
     */
    public async readFileContent(uri: vscode.Uri): Promise<string> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            return document.getText();
        } catch (error) {
            if (this.debug) {
                this.outputChannel.appendLine(`File Utils: Error reading file ${uri.fsPath}: ${error}`);
            }
            return '';
        }
    }

    /**
     * Get relative path from one URI to another
     */
    public getRelativePath(from: vscode.Uri, to: vscode.Uri): string {
        const fromPath = path.dirname(from.fsPath);
        const toPath = to.fsPath;
        return path.relative(fromPath, toPath);
    }

    /**
     * Normalize path separators
     */
    public normalizePath(filePath: string): string {
        return filePath.replace(/\\/g, '/');
    }

    /**
     * Check if path is within workspace
     */
    public isInWorkspace(uri: vscode.Uri): boolean {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return workspaceFolder !== undefined;
    }

    /**
     * Get workspace folder for a URI
     */
    public getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
        return vscode.workspace.getWorkspaceFolder(uri);
    }

    /**
     * Parse import statements from JavaScript/TypeScript files
     */
    public parseImportStatements(content: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+(?:[^'"]*['"])([^'"]+)['"];?/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (this.isCSSFile(importPath)) {
                imports.push(importPath);
            }
        }

        if (this.debug && imports.length > 0) {
            this.outputChannel.appendLine(`File Utils: Found ${imports.length} CSS import statements`);
        }

        return imports;
    }

    /**
     * Parse link tags from HTML files
     */
    public parseLinkTags(content: string): string[] {
        const links: string[] = [];
        const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            if (this.isCSSFile(href)) {
                links.push(href);
            }
        }

        if (this.debug && links.length > 0) {
            this.outputChannel.appendLine(`File Utils: Found ${links.length} CSS link tags`);
        }

        return links;
    }

    /**
     * Check if a file path refers to a CSS file
     */
    public isCSSFile(filePath: string): boolean {
        const cssExtensions = ['.css', '.scss', '.sass', '.less', '.styl'];
        const ext = path.extname(filePath).toLowerCase();
        return cssExtensions.includes(ext);
    }

    /**
     * Check if a file is a supported source file
     */
    public isSupportedSourceFile(filePath: string): boolean {
        const supportedExtensions = ['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.vue', '.php'];
        const ext = path.extname(filePath).toLowerCase();
        return supportedExtensions.includes(ext);
    }

    /**
     * Get file extension
     */
    public getFileExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }

    /**
     * Get file name without extension
     */
    public getFileNameWithoutExtension(filePath: string): string {
        return path.basename(filePath, path.extname(filePath));
    }

    /**
     * Resolve glob patterns for file searching
     */
    public createGlobPattern(extensions: string[]): string {
        if (extensions.length === 1) {
            return `**/*${extensions[0]}`;
        }
        return `**/*.{${extensions.map(ext => ext.startsWith('.') ? ext.slice(1) : ext).join(',')}}`;
    }

    /**
     * Check if file is in node_modules or other excluded directories
     */
    public shouldExcludeFile(uri: vscode.Uri): boolean {
        const filePath = uri.fsPath;
        const excludedDirs = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'out',
            '.vscode',
            'coverage'
        ];

        const isExcluded = excludedDirs.some(dir => filePath.includes(path.sep + dir + path.sep));
        
        if (this.debug && isExcluded) {
            this.outputChannel.appendLine(`File Utils: Excluding file in restricted directory: ${filePath}`);
        }
        
        return isExcluded;
    }

    /**
     * Get directory depth relative to workspace
     */
    public getDirectoryDepth(uri: vscode.Uri): number {
        const workspaceFolder = this.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return 0;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        return relativePath.split(path.sep).length - 1;
    }

    /**
     * Sort files by relevance to the source document
     */
    public sortFilesByRelevance(files: vscode.Uri[], sourceDocument: vscode.TextDocument): vscode.Uri[] {
        const sourceDir = path.dirname(sourceDocument.uri.fsPath);
        const sourceName = this.getFileNameWithoutExtension(sourceDocument.uri.fsPath);

        const sortedFiles = files.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, sourceDir, sourceName);
            const scoreB = this.calculateRelevanceScore(b, sourceDir, sourceName);
            return scoreB - scoreA; // Higher scores first
        });

        if (this.debug && sortedFiles.length > 0) {
            this.outputChannel.appendLine(`File Utils: Sorted ${sortedFiles.length} files by relevance`);
            sortedFiles.slice(0, 5).forEach((file, index) => {
                const score = this.calculateRelevanceScore(file, sourceDir, sourceName);
                this.outputChannel.appendLine(`  ${index + 1}. ${path.basename(file.fsPath)} (score: ${score})`);
            });
        }

        return sortedFiles;
    }

    /**
     * Calculate relevance score for a CSS file relative to source
     */
    private calculateRelevanceScore(cssFile: vscode.Uri, sourceDir: string, sourceName: string): number {
        const cssDir = path.dirname(cssFile.fsPath);
        const cssName = this.getFileNameWithoutExtension(cssFile.fsPath);

        let score = 0;

        // Exact name match gets highest score
        if (cssName === sourceName) {
            score += 100;
        }

        // Same directory gets high score
        if (cssDir === sourceDir) {
            score += 50;
        }

        // Parent/child directory relationship
        if (sourceDir.startsWith(cssDir)) {
            const depth = sourceDir.replace(cssDir, '').split(path.sep).length - 1;
            score += Math.max(0, 30 - depth * 5);
        }

        // Common naming patterns
        const commonNames = ['index', 'main', 'app', 'global', 'style', 'styles', 'base', 'common'];
        if (commonNames.includes(cssName.toLowerCase())) {
            score += 25;
        }

        // Bonus for CSS modules
        if (cssName.includes('.module') || cssName.includes('.component')) {
            score += 15;
        }

        return score;
    }

    /**
     * Enhanced import detection with multiple patterns
     */
    public detectAllImports(content: string): string[] {
        const imports: string[] = [];
        
        // Various import patterns
        const patterns = [
            // Standard ES6 imports
            /import\s+['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]/gi,
            // CSS imports
            /@import\s+['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]/gi,
            // Require statements
            /require\s*\(\s*['"`]([^'"`]+\.(?:css|scss|sass|less|styl))['"`]\s*\)/gi,
            // SCSS/SASS @use
            /@use\s+['"`]([^'"`]+)['"`]/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                imports.push(importPath);
            }
        }

        if (this.debug && imports.length > 0) {
            this.outputChannel.appendLine(`File Utils: Detected ${imports.length} style imports`);
        }

        return [...new Set(imports)]; // Remove duplicates
    }

    /**
     * Check if a file path exists with common extensions
     */
    public resolveWithExtensions(basePath: string, extensions: string[] = ['.css', '.scss', '.sass', '.less', '.styl']): string | undefined {
        // Try exact path first
        if (fs.existsSync(basePath)) {
            return basePath;
        }

        // Try with extensions
        for (const ext of extensions) {
            const pathWithExt = basePath + ext;
            if (fs.existsSync(pathWithExt)) {
                return pathWithExt;
            }
        }

        // Try index files
        for (const ext of extensions) {
            const indexPath = path.join(basePath, `index${ext}`);
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
        }

        return undefined;
    }
}