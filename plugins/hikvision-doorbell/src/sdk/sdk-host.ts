import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { getInstalledSdk, pushSupport, SdkInfo } from './sdk-package';

export interface SdkStatus
{
    installed: SdkInfo | null;
    arch: string;
    python: boolean;
    supported: boolean;
    reason?: string;
}

let pythonFound: boolean | undefined;

/** Where the plugin keeps its data; the SDK goes to <volume>/hcnetsdk. */
export function pluginVolume(): string
{
    return process.env.SCRYPTED_PLUGIN_VOLUME;
}

/** The sidecar ships in the plugin's fs/ folder, which is the plugin process cwd. */
export function sidecarScriptPath(): string
{
    return join (process.cwd(), 'hcnetsdk_sidecar.py');
}

export function hasPython(): boolean
{
    if (pythonFound === undefined) {
        pythonFound = spawnSync ('python3', ['--version'], { timeout: 5000 }).status === 0;
    }
    return pythonFound;
}

export function getSdkStatus(): SdkStatus
{
    const python = hasPython();
    const support = pushSupport (process.platform, process.arch, python);
    const volume = pluginVolume();
    return {
        installed: (volume && getInstalledSdk (volume, process.arch)) || null,
        arch: process.arch,
        python,
        supported: support.supported,
        reason: support.supported === false ? support.reason : undefined,
    };
}
