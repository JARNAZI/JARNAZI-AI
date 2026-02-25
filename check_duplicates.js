
const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/HP/Downloads/Ja_fixed_57_final_checklist_fixes-1/src/i18n/dictionaries/de.ts';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const stack = [];
let currentObjKeys = new Set();
const duplicates = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('//')) continue;

    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;

    for (let j = 0; j < openCount; j++) {
        stack.push(currentObjKeys);
        currentObjKeys = new Set();
    }

    const match = line.match(/^\s+([\w"]+):/);
    if (match) {
        const key = match[1].replace(/"/g, '');
        if (currentObjKeys.has(key)) {
            duplicates.push({ line: i + 1, key });
        } else {
            currentObjKeys.add(key);
        }
    }

    for (let j = 0; j < closeCount; j++) {
        if (stack.length > 0) {
            currentObjKeys = stack.pop();
        }
    }
}

let output = '';
if (duplicates.length > 0) {
    output = 'Found duplicates:\n';
    duplicates.forEach(d => output += `Line ${d.line}: ${d.key}\n`);
} else {
    output = 'No duplicates found.';
}
fs.writeFileSync('dupes_output.txt', output);
console.log(output);
