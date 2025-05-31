import path from "node:path";
import Database from 'better-sqlite3';

const dbPath = path.resolve(__dirname, '../../runner.db');
export const databaseClient = new Database(dbPath);
