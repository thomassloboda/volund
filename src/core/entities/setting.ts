export class Setting {
    theme: string;
    nodeVersion: string;
    pythonVersion: string;

    constructor({theme = 'vs-dark', nodeVersion = 'system', pythonVersion = 'system'} = {}) {
        this.theme = theme;
        this.nodeVersion = nodeVersion;
        this.pythonVersion = pythonVersion;
    }

    setTheme(theme: string) {
        this.theme = theme;
    }

    setNodeVersion(version: string) {
        this.nodeVersion = version;
    }

    setPythonVersion(version: string) {
        this.pythonVersion = version;
    }
}
