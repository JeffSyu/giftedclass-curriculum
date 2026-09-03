const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. PDF logic: pageWidth and pageHeight based on orientation
content = content.replace(
  "const pageWidth = 297;",
  "const pageWidth = orientation === 'landscape' ? 297 : 210;"
);
content = content.replace(
  "const pageHeight = 210;",
  "const pageHeight = orientation === 'landscape' ? 210 : 297;"
);
content = content.replace(
  "pdf.addPage('a4', 'landscape');",
  "pdf.addPage('a4', orientation);"
);
content = content.replace(
  "orientation: 'landscape',",
  "orientation: orientation,"
);

// 2. PDF Container Width
content = content.replace(
  "style={{ width: '1080px' }}",
  "style={{ width: orientation === 'landscape' ? '1080px' : '768px' }}"
);
content = content.replace(
  "style={{ width: '1080px' }}",
  "style={{ width: orientation === 'landscape' ? '1080px' : '768px' }}"
); // There are two instances

// 3. Excel Worksheet Layout
const buildWorksheetReplacement = `  const buildWorksheet = (worksheet: ExcelJS.Worksheet, gridData: any) => {
    const themeColor = THEMES[selectedTheme];
    let currentRow = 1;
    worksheet.pageSetup.orientation = orientation;

    if (orientation === 'portrait') {
      worksheet.columns = [
        { width: 6 },
        { width: 10 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
      ];
    } else {
      worksheet.columns = [
        { width: 8 },
        { width: 14 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
      ];
    }`;
content = content.replace(
  "  const buildWorksheet = (worksheet: ExcelJS.Worksheet, gridData: any) => {\n    const themeColor = THEMES[selectedTheme];\n    let currentRow = 1;",
  buildWorksheetReplacement
);

// 4. Excel Row Heights
content = content.replace(
  "row.height = maxLines * 16 + 10;",
  "row.height = orientation === 'landscape' ? 45 : 70;"
);

fs.writeFileSync('src/components/Export.tsx', content);
