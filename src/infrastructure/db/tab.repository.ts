import {databaseClient} from "./client";
import {Tab} from "../../core/entities/tab";


class TabRepository {
    constructor() {
        databaseClient.prepare(`CREATE TABLE IF NOT EXISTS tabs
                                (
                                    id         TEXT PRIMARY KEY,
                                    title      TEXT,
                                    language   TEXT,
                                    code       TEXT,
                                    layout     TEXT,
                                    created_at TEXT,
                                    updated_at TEXT
                                )
        `).run();
    }


    getAll() {
        return databaseClient.prepare('SELECT * FROM tabs ORDER BY updated_at DESC').all();
    }

    save(tab: Tab) {
        const now = new Date().toISOString();
        databaseClient.prepare(`
            INSERT OR
            REPLACE
            INTO tabs
                (id, title, language, code, layout, created_at, updated_at)
            VALUES (@id, @title, @language, @code, @layout, @created_at, @updated_at)
        `).run({...tab, created_at: now, updated_at: now});
    }

    deleteById(id: string) {
        databaseClient.prepare('DELETE FROM tabs WHERE id = ?').run(id);
    }
}

export const tabRepository = new TabRepository();
