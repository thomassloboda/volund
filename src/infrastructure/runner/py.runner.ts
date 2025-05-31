import {IRunner, IRunnerRunResult} from "./irunner";
import * as child_process from "node:child_process";

export class PythonRunner extends IRunner {
    get language() {
        return 'py';
    }

    async run(code: string): Promise<IRunnerRunResult> {
        try {
            const missing = await this._detectMissingImports(code);
            if (missing.length > 0) {
                // Return missing packages instead of installing them automatically
                return {
                    stdout: '',
                    stderr: '',
                    error: `Missing Python packages: ${missing.join(', ')}`,
                    missingPackages: missing
                };
            }

            const result = await this._execPython(code) as { stdout: string, stderr: string };
            return {stdout: result.stdout, stderr: result.stderr, error: null};
        } catch (err) {
            return {stdout: '', stderr: '', error: err.message};
        }
    }

    async _detectMissingImports(code: string) {
        const imports = Array.from(code.matchAll(/^import (\w+)/gm)).map(m => m[1]);
        const notInstalled = [];

        for (const mod of imports) {
            try {
                child_process.execSync(`uv pip show ${mod}`, {stdio: 'ignore'});
            } catch {
                notInstalled.push(mod);
            }
        }

        return notInstalled;
    }

    async _installPackages(modules: string[] = []) {
        return new Promise((resolve, reject) => {
            const proc = child_process.spawn('uv', ['pip', 'install', ...modules], {
                stdio: 'inherit',
            });
            proc.on('close', code => code === 0 ? resolve(null) : reject(new Error(`Failed to install: ${modules.join(', ')}`)));
        });
    }

    async _execPython(code: string) {
        return new Promise((resolve) => {
            const proc = child_process.spawn('uv', ['run', 'python', '-c', code]);

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', data => (stdout += data.toString()));
            proc.stderr.on('data', data => (stderr += data.toString()));

            proc.on('close', () => {
                resolve({stdout, stderr});
            });
        });
    }
}
