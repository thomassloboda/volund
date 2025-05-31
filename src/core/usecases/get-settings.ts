import {settingRepository} from "../../infrastructure/db/setting.repository";
import {Setting} from "../entities/setting";

// Constants for setting keys
export const SETTING_KEYS = {
    THEME: 'theme',
    NODE_VERSION: 'nodeVersion',
    PYTHON_VERSION: 'pythonVersion',
    LAST_LANGUAGE: 'lastLanguage',
    TS_VERSION: 'tsVersion',
    PY_VERSION: 'pyVersion'
};

// Get a specific setting by key
export const getSetting = (key: string) => {
    return settingRepository.get(key);
};

// Set a specific setting
export const setSetting = (key: string, value: any) => {
    settingRepository.set(key, value);
    return value;
};

// Get all settings (for backward compatibility)
export const getSettings = () => {
    // Create a new Setting object with default values
    const setting = new Setting();

    // Get individual settings and override defaults
    const theme = getSetting(SETTING_KEYS.THEME);
    if (theme) setting.setTheme(theme);

    const nodeVersion = getSetting(SETTING_KEYS.NODE_VERSION);
    if (nodeVersion) setting.setNodeVersion(nodeVersion);

    const pythonVersion = getSetting(SETTING_KEYS.PYTHON_VERSION);
    if (pythonVersion) setting.setPythonVersion(pythonVersion);

    // Get other settings that might not be part of the Setting class
    const lastLanguage = getSetting(SETTING_KEYS.LAST_LANGUAGE);
    const tsVersion = getSetting(SETTING_KEYS.TS_VERSION);
    const pyVersion = getSetting(SETTING_KEYS.PY_VERSION);

    // Return a combined object with all settings
    return {
        ...setting,
        ...(lastLanguage ? { lastLanguage } : {}),
        ...(tsVersion ? { tsVersion } : {}),
        ...(pyVersion ? { pyVersion } : {})
    };
};

// Save all settings (for backward compatibility)
export const saveSettings = (data: any) => {
    const setting = new Setting(data);

    // Save individual settings
    setSetting(SETTING_KEYS.THEME, setting.theme);
    setSetting(SETTING_KEYS.NODE_VERSION, setting.nodeVersion);
    setSetting(SETTING_KEYS.PYTHON_VERSION, setting.pythonVersion);

    // Save other settings that might not be part of the Setting class
    if (data.lastLanguage) {
        setSetting(SETTING_KEYS.LAST_LANGUAGE, data.lastLanguage);
    }

    if (data.tsVersion) {
        setSetting(SETTING_KEYS.TS_VERSION, data.tsVersion);
    }

    if (data.pyVersion) {
        setSetting(SETTING_KEYS.PY_VERSION, data.pyVersion);
    }

    // For backward compatibility, also save the full object
    const mergedSettings = { ...data, ...setting };
    settingRepository.set('config', mergedSettings);

    return mergedSettings;
}
