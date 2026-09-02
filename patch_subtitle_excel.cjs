const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Excel
const excelSubtitleRegex = /subTitleCell\.value = gridData\.subTitleRow;\n\s*subTitleCell\.font = \{ size: 12, name: 'Microsoft JhengHei' \};\n\s*subTitleCell\.alignment = \{ horizontal: 'center', vertical: 'top', wrapText: true \};/;
const excelSubtitleNew = `        if (typeof gridData.subTitleRow === 'string' && /\\[(粗體|斜體|底線|大字體|小字體|預設)\\]/.test(gridData.subTitleRow)) {
          subTitleCell.value = getExcelRichText(gridData.subTitleRow, 'Microsoft JhengHei', false);
        } else {
          subTitleCell.value = gridData.subTitleRow;
        }
        if (!subTitleCell.value || typeof subTitleCell.value !== 'object' || !('richText' in subTitleCell.value)) {
          subTitleCell.font = { name: 'Microsoft JhengHei', size: 12 };
        }
        subTitleCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };`;
content = content.replace(excelSubtitleRegex, excelSubtitleNew);

fs.writeFileSync('src/components/Export.tsx', content);
