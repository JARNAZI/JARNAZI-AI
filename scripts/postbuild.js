const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'out');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=https://jarnazi.com" />
</head>
<body></body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Created out/index.html for Capacitor sync.');
