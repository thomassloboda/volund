import {IRunner, IRunnerRunResult} from "./irunner";
import * as vm from "node:vm";
import * as child_process from "node:child_process";
import path from "node:path";
import * as ts from "typescript";


export class JSRunner extends IRunner {
    get language() {
        return 'ts';
    }

    async run(code: string, language?: string): Promise<IRunnerRunResult> {
        // Transpile TypeScript to JavaScript
        try {
            // Transpile TypeScript to JavaScript
            const transpileOutput = ts.transpileModule(code, {
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES2020,
                    strict: false,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true
                }
            });
            code = transpileOutput.outputText;
        } catch (err) {
            return {
                stdout: '',
                stderr: '',
                error: `TypeScript transpilation failed: ${err.message}`
            };
        }
        let stdout = '';
        let stderr = '';

        // Create a sandbox with console methods that capture output
        const sandbox = {
            console: {
                log: (...args: any[]) => {
                    stdout += args.map(arg => String(arg)).join(' ') + '\n';
                },
                error: (...args: any[]) => {
                    stderr += args.map(arg => String(arg)).join(' ') + '\n';
                },
                warn: (...args: any[]) => {
                    stdout += '[WARN] ' + args.map(arg => String(arg)).join(' ') + '\n';
                },
                info: (...args: any[]) => {
                    stdout += '[INFO] ' + args.map(arg => String(arg)).join(' ') + '\n';
                }
            }
        };

        const context = vm.createContext(sandbox);

        try {
            const output = vm.runInContext(code, context, {timeout: 3000});
            // Include both console output and return value
            if (output !== undefined && output !== null) {
                stdout += String(output) + '\n';
            }
            return {stdout, stderr, error: null};
        } catch (err) {
            const missing = this._parseMissingModule(err);
            if (missing) {
                // Return missing package instead of installing it automatically
                return {
                    stdout,
                    stderr,
                    error: `Missing npm package: ${missing}`,
                    missingPackages: [missing]
                };
            }
            return {stdout, stderr, error: err.message};
        }
    }

    _parseMissingModule(error: Error) {
        const match = error.message.match(/Cannot find module '(.*?)'/);
        return match ? match[1] : null;
    }

    async _installPackage(pkg: string) {
        return new Promise((resolve, reject) => {
            const proc = child_process.spawn('npm', ['install', pkg], {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'inherit'
            });

            proc.on('close', code => code === 0 ? resolve(null) : reject(`npm install failed for ${pkg}`));
        });
    }
}
