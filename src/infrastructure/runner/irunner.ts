export type IRunnerRunResult = {
    stdout: string,
    stderr: string,
    error?: string,
    missingPackages?: string[],
};


export class IRunner {
    async run(code: string):Promise<IRunnerRunResult> {
        throw new Error('run() must be implemented by subclass');
    }

    get language(): string {
        throw new Error('language getter must be implemented by subclass');
    }
}
