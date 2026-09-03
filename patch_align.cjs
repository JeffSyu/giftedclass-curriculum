const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Excel export alignment
content = content.replace(
  "cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };",
  "cell.alignment = { horizontal: 'center', vertical: i < 2 ? 'middle' : 'top', wrapText: true };"
);

// 2. Preview table
const previewTableOld = `                    <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>`;
const previewTableNew = `                    <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: cIdx < 2 ? 'center' : 'flex-start', paddingTop: cIdx < 2 ? '0' : '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>`;

// Replace all instances (should be two)
content = content.split(previewTableOld).join(previewTableNew);

fs.writeFileSync('src/components/Export.tsx', content);
