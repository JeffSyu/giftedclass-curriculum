const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Update preview table and PDF table inner div style
const oldDiv = /<div style=\{\{ height: orientation === 'landscape' \? '50px' : '80px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: cIdx < 2 \? 'center' : 'flex-start', paddingTop: cIdx < 2 \? '0' : '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' \}\}>/g;
const newDiv = `<div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: cIdx < 2 ? 'flex' : 'block', flexDirection: cIdx < 2 ? 'column' : 'row', justifyContent: cIdx < 2 ? 'center' : 'flex-start', paddingTop: cIdx < 2 ? '0' : '2px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>`;

content = content.replace(oldDiv, newDiv);

// Also let's make sure th has align-middle just in case, though it's default
const oldTh = /className="py-3 px-2 border text-center font-bold text-base"/g;
const newTh = `className="py-3 px-2 border text-center align-middle font-bold text-base"`;
content = content.replace(oldTh, newTh);

fs.writeFileSync('src/components/Export.tsx', content);
