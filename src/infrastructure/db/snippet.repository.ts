import {databaseClient} from "./client";
import {Snippet} from "../../core/entities/snippet";


class SnippetRepository {
    constructor() {
        databaseClient.prepare(`CREATE TABLE IF NOT EXISTS snippets
                                (
                                    id         TEXT PRIMARY KEY,
                                    title      TEXT,
                                    language   TEXT,
                                    code       TEXT,
                                    created_at TEXT,
                                    updated_at TEXT
                                )
        `).run();
    }


    getAll() {
        return databaseClient.prepare('SELECT * FROM snippets ORDER BY updated_at DESC').all();
    }

    save(snippet: Snippet) {
        const now = new Date().toISOString();
        databaseClient.prepare(`
            INSERT OR
            REPLACE
            INTO snippets
                (id, title, language, code, created_at, updated_at)
            VALUES (@id, @title, @language, @code, @created_at, @updated_at)
        `).run({...snippet, created_at: now, updated_at: now});
    }

}

export const snippetRepository = new SnippetRepository();
