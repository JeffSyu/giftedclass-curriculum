const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Update font sizes in getExcelRichText
const oldGetExcelRichText = `  const baseSize = isFirstCol ? 12 : 11;
  const baseBold = isFirstCol;
  
  return {
    richText: chunks.map(chunk => {
      let size = baseSize;
      if (chunk.size === 'large') size = baseSize + 3;
      if (chunk.size === 'small') size = baseSize - 2;`;

const newGetExcelRichText = `  const baseSize = 12; // 課程資訊預設12pt
  const baseBold = isFirstCol;
  
  return {
    richText: chunks.map(chunk => {
      let size = baseSize;
      if (chunk.size === 'large') size = 14;
      if (chunk.size === 'small') size = 10;`;
content = content.replace(oldGetExcelRichText, newGetExcelRichText);


// 2. Update font sizes in Excel generation
content = content.replace(
  "subTitleCell.font = { name: 'Microsoft JhengHei', size: 12 };",
  "subTitleCell.font = { name: 'Microsoft JhengHei', size: 14 };" // 名稱14pt
);

content = content.replace(
  "cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei', size: 12 };",
  "cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei', size: 14 };" // 表格首列14pt
);

content = content.replace(
  "cell.font = { name: 'Microsoft JhengHei', bold: i === 0, size: i === 0 ? 12 : 11 };",
  "cell.font = { name: 'Microsoft JhengHei', bold: i === 0, size: i === 0 ? 14 : (i === 1 ? 11 : 12) };" // 節次14pt, 時間11pt, 課程預設12pt
);


// 3. Update Excel row height calculation (auto fit instead of fixed)
const oldExcelRowHeight = `      row.height = orientation === 'landscape' ? 45 : 70;`;
const newExcelRowHeight = `      // row.height removed to auto fit, we'll set min height using hidden elements or let Excel handle it, but exceljs doesn't natively do min-height easily.
      // So we will set height dynamically based on lines
      const minHeight = orientation === 'landscape' ? (79 * 0.75) : (104 * 0.75); // approx px to pt conversion (0.75)
      const calculatedHeight = maxLines * 16 + 10; // 16pt per line + padding
      row.height = Math.max(minHeight, calculatedHeight);`;
content = content.replace(oldExcelRowHeight, newExcelRowHeight);

// 4. update Excel borders to medium/thick outline
content = content.replace(
  "worksheet.eachRow((row, rowNumber) => {",
  `worksheet.eachRow((row, rowNumber) => {
      // Set outer borders logic later`
);


fs.writeFileSync('src/components/Export.tsx', content);
