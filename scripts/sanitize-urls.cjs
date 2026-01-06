const fs = require('fs');
const path = require('path');

const targetDirs = [
    'c:/Users/yassi/Downloads/GROW-YOUR-NEED-VISION/scripts',
    'c:/Users/yassi/Downloads/GROW-YOUR-NEED-VISION/scripts/maintenance',
    'c:/Users/yassi/Downloads/GROW-YOUR-NEED-VISION/src/apps/edumultiverse/scripts'
];

const patterns = [
    { from: process.env.POCKETBASE_URL || 'http://localhost:8090', to: "process.env.POCKETBASE_URL || 'http://localhost:8090'" },
    { from: process.env.POCKETBASE_URL || 'http://localhost:8090', to: "process.env.POCKETBASE_URL || 'http://localhost:8090'" }
];

function sanitizeFile(filePath) {
    if (!fs.statSync(filePath).isFile()) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(pattern => {
        // Need to be careful with quotes. Most scripts use new PocketBase('...')
        const singleQuote = `'${pattern.from}'`;
        const doubleQuote = `"${pattern.from}"`;

        if (content.includes(singleQuote)) {
            content = content.replace(new RegExp(singleQuote, 'g'), pattern.to);
            modified = true;
        }
        if (content.includes(doubleQuote)) {
            content = content.replace(new RegExp(doubleQuote, 'g'), pattern.to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Sanitized URL in: ${path.basename(filePath)}`);
    }
}

targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.cjs')) {
            sanitizeFile(path.join(dir, file));
        }
    });
});

console.log('URL Sanitization complete!');
