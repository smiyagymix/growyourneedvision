const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/yassi/Downloads/GROW-YOUR-NEED-VISION/src/apps/edumultiverse/scripts';
const emailToReplace = process.env.POCKETBASE_ADMIN_EMAIL;
const passToReplace = 'Darnag123456789@';

const emailReplacement = "process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL";
const passReplacement = "process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD";

function sanitizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes(`'${emailToReplace}'`)) {
        content = content.replace(new RegExp(`'${emailToReplace}'`, 'g'), emailReplacement);
        modified = true;
    }
    if (content.includes(`"${emailToReplace}"`)) {
        content = content.replace(new RegExp(`"${emailToReplace}"`, 'g'), emailReplacement);
        modified = true;
    }
    if (content.includes(`'${passToReplace}'`)) {
        content = content.replace(new RegExp(`'${passToReplace}'`, 'g'), passReplacement);
        modified = true;
    }
    if (content.includes(`"${passToReplace}"`)) {
        content = content.replace(new RegExp(`"${passToReplace}"`, 'g'), passReplacement);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Sanitized: ${path.basename(filePath)}`);
    }
}

fs.readdirSync(targetDir).forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.cjs')) {
        sanitizeFile(path.join(targetDir, file));
    }
});

console.log('Sanitization complete!');
