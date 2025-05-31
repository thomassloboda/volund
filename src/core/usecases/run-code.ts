import {runWithAdapter} from "../../adapters/runner.adapter";
import {JSRunner} from "../../infrastructure/runner/js.runner";
import {PythonRunner} from "../../infrastructure/runner/py.runner";

export const runCode = async (code: string, language: string) => {
    return await runWithAdapter(code, language);
};

export const installPackages = async (packages: string[], language: string) => {
    if (!packages || packages.length === 0) {
        return { success: false, error: 'No packages specified' };
    }

    try {
        if (language === 'ts') {
            const jsRunner = new JSRunner();
            for (const pkg of packages) {
                await jsRunner._installPackage(pkg);
            }
        } else if (language === 'py') {
            const pyRunner = new PythonRunner();
            await pyRunner._installPackages(packages);
        } else {
            return { success: false, error: `Unsupported language: ${language}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
