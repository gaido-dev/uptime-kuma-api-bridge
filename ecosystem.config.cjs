// CommonJS on purpose: pm2 loads this file with require(), which would fail if it were
// parsed as ESM under this project's "type": "module" (a plain .js file would be).
module.exports = {
    apps: [
        {
            name: "uptime-kuma-api-bridge",
            script: "dist/index.mjs",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
        },
    ],
};
