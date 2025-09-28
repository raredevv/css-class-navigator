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
exports.FileUtils = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class FileUtils {
    /**
     * Resolve a relative path from a document URI
     */
    resolveRelativePath(documentUri, relativePath) {
        try {
            const documentDir = path.dirname(documentUri.fsPath);
            console.log('Document dir:', documentDir);
            const resolvedPath = path.resolve(documentDir, relativePath);
            console.log('Resolved path:', resolvedPath, 'Exists:', fs.existsSync(resolvedPath));
            if (fs.existsSync(resolvedPath)) {
                return vscode.Uri.file(resolvedPath);
            }
            return undefined;
        }
        catch (error) {
            console.error('Error resolving path:', error);
            return undefined;
        }
    }
    /**
     * Check if a file exists
     */
    async fileExists(uri) {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get all CSS files in workspace
     */
    async findCSSFiles(workspaceFolder) {
        const cssGlob = '**/*.{css,scss,sass,less,styl}';
        const excludePattern = '**/node_modules/**';
        try {
            return await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, cssGlob), excludePattern);
        }
        catch (error) {
            console.error('Error finding CSS files:', error);
            return [];
        }
    }
    /**
     * Find CSS files that might be related to the given document
     */
    async findRelatedCSSFiles(document) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return [];
        }
        const allCssFiles = await this.findCSSFiles(workspaceFolder);
        const relatedFiles = [];
        for (const cssFile of allCssFiles) {
            relatedFiles.push(cssFile);
        }
        return this.sortFilesByRelevance(relatedFiles, document);
    }
    /**
     * Read file content as string
     */
    async readFileContent(uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            return document.getText();
        }
        catch (error) {
            console.error('Error reading file:', uri.fsPath, error);
            return '';
        }
    }
    /**
     * Get relative path from one URI to another
     */
    getRelativePath(from, to) {
        const fromPath = path.dirname(from.fsPath);
        const toPath = to.fsPath;
        return path.relative(fromPath, toPath);
    }
    /**
     * Normalize path separators
     */
    normalizePath(filePath) {
        return filePath.replace(/\\/g, '/');
    }
    /**
     * Check if path is within workspace
     */
    isInWorkspace(uri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return workspaceFolder !== undefined;
    }
    /**
     * Get workspace folder for a URI
     */
    getWorkspaceFolder(uri) {
        return vscode.workspace.getWorkspaceFolder(uri);
    }
    /**
     * Parse import statements from JavaScript/TypeScript files
     */
    parseImportStatements(content) {
        const imports = [];
        const importRegex = /import\s+(?:[^'"]*['"])([^'"]+)['"];?/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (this.isCSSFile(importPath)) {
                imports.push(importPath);
            }
        }
        return imports;
    }
    /**
     * Parse link tags from HTML files
     */
    parseLinkTags(content) {
        const links = [];
        const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            if (this.isCSSFile(href)) {
                links.push(href);
            }
        }
        return links;
    }
    /**
     * Check if a file path refers to a CSS file
     */
    isCSSFile(filePath) {
        const cssExtensions = ['.css', '.scss', '.sass', '.less', '.styl'];
        const ext = path.extname(filePath).toLowerCase();
        return cssExtensions.includes(ext);
    }
    /**
     * Check if a file is a supported source file
     */
    isSupportedSourceFile(filePath) {
        const supportedExtensions = ['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.vue', '.php'];
        const ext = path.extname(filePath).toLowerCase();
        return supportedExtensions.includes(ext);
    }
    /**
     * Get file extension
     */
    getFileExtension(filePath) {
        return path.extname(filePath).toLowerCase();
    }
    /**
     * Get file name without extension
     */
    getFileNameWithoutExtension(filePath) {
        return path.basename(filePath, path.extname(filePath));
    }
    /**
     * Resolve glob patterns for file searching
     */
    createGlobPattern(extensions) {
        if (extensions.length === 1) {
            return `**/*${extensions[0]}`;
        }
        return `**/*.{${extensions.map(ext => ext.startsWith('.') ? ext.slice(1) : ext).join(',')}}`;
    }
    /**
     * Check if file is in node_modules or other excluded directories
     */
    shouldExcludeFile(uri) {
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
        return excludedDirs.some(dir => filePath.includes(path.sep + dir + path.sep));
    }
    /**
     * Get directory depth relative to workspace
     */
    getDirectoryDepth(uri) {
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
    sortFilesByRelevance(files, sourceDocument) {
        const sourceDir = path.dirname(sourceDocument.uri.fsPath);
        const sourceName = this.getFileNameWithoutExtension(sourceDocument.uri.fsPath);
        return files.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, sourceDir, sourceName);
            const scoreB = this.calculateRelevanceScore(b, sourceDir, sourceName);
            return scoreB - scoreA; // Higher scores first
        });
    }
    /**
     * Calculate relevance score for a CSS file relative to source
     */
    calculateRelevanceScore(cssFile, sourceDir, sourceName) {
        const cssDir = path.dirname(cssFile.fsPath);
        const cssName = this.getFileNameWithoutExtension(cssFile.fsPath);
        let score = 0;
        if (cssName === sourceName) {
            score += 100;
        }
        if (cssDir === sourceDir) {
            score += 50;
        }
        if (sourceDir.startsWith(cssDir)) {
            const depth = sourceDir.replace(cssDir, '').split(path.sep).length - 1;
            score += Math.max(0, 30 - depth * 5);
        }
        const commonNames = ['index', 'main', 'app', 'global', 'style', 'styles', 'base', 'common'];
        if (commonNames.includes(cssName.toLowerCase())) {
            score += 25;
        }
        return score;
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=fileUtils.js.map