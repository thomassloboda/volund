import { ipcMain } from 'electron';
import {runCode, installPackages} from "../core/usecases/run-code";
import {getSettings, saveSettings, getSetting, setSetting} from "../core/usecases/get-settings";
import {getTabs} from "../core/usecases/get-tabs";
import {saveTab, deleteTab} from "../core/usecases/save-tab";

ipcMain.handle("run-code", async (event, {code, lang}) =>
    runCode(code, lang),
);
ipcMain.handle("get-settings", async () => getSettings());
ipcMain.handle("save-settings", async (event, settings) => saveSettings(settings));
ipcMain.handle("get-setting", async (event, key) => getSetting(key));
ipcMain.handle("set-setting", async (event, {key, value}) => setSetting(key, value));

// Tab handlers
ipcMain.handle("get-tabs", async () => getTabs());
ipcMain.handle("save-tab", async (event, tab) => saveTab(tab));
ipcMain.handle("delete-tab", async (event, id) => deleteTab(id));

// Package installation handler
ipcMain.handle("install-packages", async (event, {packages, language}) =>
    installPackages(packages, language)
);
