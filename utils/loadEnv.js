const fs = require('fs');
const path = require('path');

const loadEnv = (filePath = path.join(__dirname, '..', '.env')) => {
    if (!fs.existsSync(filePath)) return;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = trimmed.slice(0, equalsIndex).trim();
        if (!key || process.env[key] !== undefined) continue;

        let value = trimmed.slice(equalsIndex + 1).trim();
        const isQuoted =
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"));

        if (isQuoted) value = value.slice(1, -1);

        process.env[key] = value;
    }
};

module.exports = loadEnv;
