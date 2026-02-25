const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/HP/Downloads/Ja_fixed_57_final_checklist_fixes-1/src/i18n/dictionaries';
let out = '';
fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('.ts')) return;
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = content.split('\n');
    const stack = [];
    let keys = new Set();
    lines.forEach((l, i) => {
        if (l.includes('{') && !l.trim().startsWith('//')) {
            const openCount = (l.match(/\{/g) || []).length;
            for (let j = 0; j < openCount; j++) {
                stack.push(keys);
                keys = new Set();
            }
        }

        const m = l.match(/^\s+([\w"]+):/);
        if (m) {
            const key = m[1].replace(/"/g, '');
            if (keys.has(key)) out += (file + ' dup line ' + (i + 1) + ': ' + key + '\n');
            else keys.add(key);
        }

        if (l.includes('}') && !l.trim().startsWith('//')) {
            const closeCount = (l.match(/\}/g) || []).length;
            for (let j = 0; j < closeCount; j++) {
                keys = stack.pop() || new Set();
            }
        }
    });
});
fs.writeFileSync('c:/Users/HP/Downloads/Ja_fixed_57_final_checklist_fixes-1/dup_results.txt', out || 'No duplicates.');
