import {IRunner} from "../infrastructure/runner/irunner";
import {JSRunner} from "../infrastructure/runner/js.runner";
import {PythonRunner} from "../infrastructure/runner/py.runner";


const runners: Record<string, IRunner> = {
    'ts': new JSRunner(),
    'py': new PythonRunner(),
};

export const runWithAdapter = async (code: string, language: string) => {
    const runner = runners[language];

    if (!runner) {
        return {
            stdout: '',
            stderr: '',
            error: `Unsupported language: ${language}`,
        };
    }

    try {
        return await runner.run(code);
    } catch (err) {
        return {
            stdout: '',
            stderr: '',
            error: `Runner failed: ${err.message}`,
        };
    }
}

module.exports = {
    runWithAdapter,
};
