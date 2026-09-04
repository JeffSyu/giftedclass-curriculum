const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldExcelText2 = "size: i === 0 ? 14 : (i === 1 ? 11 : 12)";
const newExcelText2 = "size: i === 0 ? 14 : (i === 1 ? 11 : 12)";

const oldTableTitle = "titleCell.font = { size: 16, bold: true, name: 'Microsoft JhengHei' };";
const newTableTitle = "titleCell.font = { size: 16, bold: true, name: 'Microsoft JhengHei' };";

// Let's just make sure it's 16. Yes, it is 16.
fs.writeFileSync('src/components/Export.tsx', content);
