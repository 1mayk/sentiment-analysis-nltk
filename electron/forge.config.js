const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    icon: "assets/icon",
    asar: true,
    extraResources: [
      {
        from: path.resolve(__dirname, "backend", "dist"),
        to: "backend",
        filter: ["**/*"]
      }
    ],
    files: [
      "main.js",
      "dist/**/*",
      "assets/**/*"
    ],
    appId: "labware.sentiment.analyzer",
    productName: "Labware Sentiment Analyzer",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@felixrieseberg/electron-forge-maker-nsis",
      config: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        perMachine: false,
        shortcutName: "labware-sentiment-analyzer",
        installerIcon: "assets/icon.ico",
        uninstallerIcon: "assets/icon.ico",
      },
    }
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
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
