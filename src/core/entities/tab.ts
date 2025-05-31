import {randomUUID} from 'crypto';

export class Tab {
    id: string;
    title: string;
    language: string;
    code: string;
    layout: string;
    createdAt: string;
    updatedAt: string;

    constructor({id, title, language, code, layout, createdAt, updatedAt}: {
        id?: string,
        title?: string,
        language?: string,
        code?: string,
        layout?: string,
        createdAt?: string,
        updatedAt?: string,
    }) {
        this.id = id || randomUUID();
        this.title = title?.trim() || 'Untitled';
        this.language = language || 'ts';

        // Set default code with a comment containing the tab name
        if (!code) {
            if (language === 'py') {
                this.code = `# Name: ${this.title}\n\n`;
            } else {
                this.code = `// Name: ${this.title}\n\n`;
            }
        } else {
            this.code = code;
        }

        this.layout = layout || 'horizontal';
        const now = new Date().toISOString();
        this.createdAt = createdAt || now;
        this.updatedAt = updatedAt || now;
    }

    updateCode(newCode: string) {
        this.code = newCode;
        this.updatedAt = new Date().toISOString();
    }

    rename(newTitle: string) {
        this.title = newTitle.trim();
        this.updatedAt = new Date().toISOString();
    }

    updateLayout(newLayout: string) {
        this.layout = newLayout;
        this.updatedAt = new Date().toISOString();
    }

    // Extract title from the first line if it matches the pattern
    extractTitleFromCode(): string | null {
        const firstLine = this.code.split('\n')[0];

        // Check for JavaScript/TypeScript style comment
        const jsMatch = firstLine.match(/\/\/\s*Name:\s*(.*)/);
        if (jsMatch) {
            return jsMatch[1].trim();
        }

        // Check for Python style comment
        const pyMatch = firstLine.match(/#\s*Name:\s*(.*)/);
        if (pyMatch) {
            return pyMatch[1].trim();
        }

        return null;
    }
}
