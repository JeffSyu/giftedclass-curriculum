const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldExcelText = "const baseSize = 12; // 課程資訊預設12pt";
const newExcelText = "const baseSize = isFirstCol ? 14 : 12; // 節次14pt, 課程資訊預設12pt";
content = content.split(oldExcelText).join(newExcelText);

fs.writeFileSync('src/components/Export.tsx', content);
