import {databaseClient} from "./client";

class SettingRepository {
    constructor() {
        databaseClient.prepare(`
            CREATE TABLE IF NOT EXISTS settings
            (
                key   TEXT PRIMARY KEY,
                value TEXT
            )
        `).run();
    }

    get(key: string) {
        const row = databaseClient.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? JSON.parse((row as { key: string, value: string }).value) : null;
    }

    set(key: string, value: string) {
        databaseClient.prepare(`
            INSERT OR
            REPLACE
            INTO settings (key, value)
            VALUES (?, ?)
        `).run(key, JSON.stringify(value));
    }

}

export const settingRepository = new SettingRepository();
