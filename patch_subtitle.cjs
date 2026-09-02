const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// React
content = content.replace(
  "{gridData.subTitleRow && <div className=\"text-m text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">{gridData.subTitleRow}</div>}",
  "{gridData.subTitleRow && <div className=\"text-m text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">{renderReactRichText(gridData.subTitleRow)}</div>}"
);

// PDF
content = content.replace(
  "{item.gridData.subTitleRow && (\n              <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">\n                {item.gridData.subTitleRow}\n              </div>\n            )}",
  "{item.gridData.subTitleRow && (\n              <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">\n                {renderReactRichText(item.gridData.subTitleRow)}\n              </div>\n            )}"
);

// Excel
const excelSubtitleRegex = /subTitleCell\.value = gridData\.subTitleRow;\n\s*subTitleCell\.font = \{ name: 'Microsoft JhengHei', size: 12 \};\n\s*subTitleCell\.alignment = \{ horizontal: 'center', vertical: 'middle', wrapText: true \};/;
const excelSubtitleNew = `        if (typeof gridData.subTitleRow === 'string' && /\\[(粗體|斜體|底線|大字體|小字體|預設)\\]/.test(gridData.subTitleRow)) {
          subTitleCell.value = getExcelRichText(gridData.subTitleRow, 'Microsoft JhengHei', false);
        } else {
          subTitleCell.value = gridData.subTitleRow;
        }
        if (!subTitleCell.value || typeof subTitleCell.value !== 'object' || !('richText' in subTitleCell.value)) {
          subTitleCell.font = { name: 'Microsoft JhengHei', size: 12 };
        }
        subTitleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };`;
content = content.replace(excelSubtitleRegex, excelSubtitleNew);

fs.writeFileSync('src/components/Export.tsx', content);
