import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerZIP} from '@electron-forge/maker-zip';
import {MakerDeb} from '@electron-forge/maker-deb';
import {MakerRpm} from '@electron-forge/maker-rpm';
import {MakerDMG} from '@electron-forge/maker-dmg';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {FusesPlugin} from '@electron-forge/plugin-fuses';
import {FuseV1Options, FuseVersion} from '@electron/fuses';
import {AutoUnpackNativesPlugin} from '@electron-forge/plugin-auto-unpack-natives';
import {PublisherGithub} from '@electron-forge/publisher-github';

const config: ForgeConfig = {
    packagerConfig: {
        icon: "./src/images/icon",
        asar: true,
        osxSign: {},
        appBundleId: 'fr.sloboda.volund',
        appCategoryType: 'public.app-category.developer-tools'
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            name: 'Völund',
            iconUrl: "./src/images/icon.ico",
            setupIcon: "./src/images/icon.ico"
        }),
        new MakerZIP({}, ['darwin']),
        new MakerDMG({
            format: 'ULFO',
            name: "Völund",
            icon: './src/images/icon.icns',
        }, ['darwin:arm64']),
        new MakerDMG({
            format: 'ULFO',
            name: "Völund",
            icon: './src/images/icon.icns',
        }, ['darwin:x64']),
        new MakerRpm({
            options: {
                productName: 'Völund',
                categories: ['Development'],
                homepage: 'https://github.com/thomassloboda/runner',
            }
        }),
        new MakerDeb({
            options: {
                productName: 'Völund',
                categories: ['Development'],
                homepage: 'https://github.com/thomassloboda/runner',
                maintainer: 'Thomas SLOBODA <thomas@sloboda.fr>'
            }
        })
    ],
    publishers: [
        new PublisherGithub({
            repository: {
                owner: 'thomassloboda',
                name: 'volund'
            },
            prerelease: false,
            // The GitHub token is read from the GITHUB_TOKEN environment variable
            // Make sure to set this before running `npm run publish`
            // You can create a token at https://github.com/settings/tokens
            // with the 'repo' scope
        })
    ],
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
        // Auto unpack native modules
        new AutoUnpackNativesPlugin({}),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

export default config;
