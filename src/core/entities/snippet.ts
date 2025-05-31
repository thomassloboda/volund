import {randomUUID} from 'crypto';

export class Snippet {
    id: string;
    title: string;
    language: string;
    code: string;
    createdAt: string;
    updatedAt: string;

    constructor({id, title, language, code, createdAt, updatedAt}: {
        id?: string,
        title?: string,
        language?: string,
        code?: string,
        createdAt?: string,
        updatedAt?: string,
    }) {
        this.id = id || randomUUID();
        this.title = title?.trim() || 'Untitled';
        this.language = language || 'ts';
        this.code = code || '';
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
    }
}
