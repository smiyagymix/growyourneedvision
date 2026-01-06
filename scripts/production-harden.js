import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDirs = [
    path.resolve(__dirname, '../scripts'),
    path.resolve(__dirname, '../scripts/maintenance'),
];

const patterns = [
    // Sanitize credentials
    {
        regex: /(['"])owner@growyourneed\.com(['"])/g,
        replacement: 'process.env.POCKETBASE_ADMIN_EMAIL'
    },
    {
        regex: /(['"])admin123456(['"])/g,
        replacement: 'process.env.POCKETBASE_ADMIN_PASSWORD'
    },
    // Sanitize redundant PocketBase URL patterns
    {
        regex: /process\.env\.POCKETBASE_URL\s*\|\|\s*process\.env\.POCKETBASE_URL\s*\|\|\s*process\.env\.POCKETBASE_URL\s*\|\|\s*'http:\/\/localhost:8090'/g,
        replacement: "process.env.POCKETBASE_URL || 'http://localhost:8090'"
    },
    {
        regex: /process\.env\.POCKETBASE_URL\s*\|\|\s*process\.env\.POCKETBASE_URL\s*\|\|\s*'http:\/\/localhost:8090'/g,
        replacement: "process.env.POCKETBASE_URL || 'http://localhost:8090'"
    },
    // Remove literal fallbacks in authWithPassword
    {
        regex: /authWithPassword\(process\.env\.POCKETBASE_ADMIN_EMAIL\s*\|\|\s*['"]owner@growyourneed\.com['"],\s*process\.env\.POCKETBASE_ADMIN_PASSWORD\s*\|\|\s*process\.env\.POCKETBASE_ADMIN_PASSWORD\s*\|\|\s*['"]admin123456['"]\)/g,
        replacement: "authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)"
    },
    {
        regex: /authWithPassword\(process\.env\.POCKETBASE_ADMIN_EMAIL\s*\|\|\s*['"]owner@growyourneed\.com['"],\s*process\.env\.POCKETBASE_ADMIN_PASSWORD\s*\|\|\s*['"]admin123456['"]\)/g,
        replacement: "authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)"
    }
];

function processFile(filePath) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return;
    if (path.basename(filePath) === 'production-harden.js') return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(p => {
        if (p.regex.test(content)) {
            content = content.replace(p.regex, p.replacement);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Hardened: ${path.relative(process.cwd(), filePath)}`);
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
            processFile(fullPath);
        }
    });
}

console.log('🛡️ Starting production hardening scan...');
targetDirs.forEach(walk);
console.log('✨ Hardening complete!');
