const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(
  "titleRow: (showTitle && titleText) ? titleText : undefined,\n      headers,",
  "titleRow: (showTitle && titleText) ? titleText : undefined,\n      subTitleRow: courseInfoTemplate.trim() ? formatCourseInfo(course) : undefined,\n      headers,"
);

const getColLetterFn = `
    const getColLetter = (colNum: number) => {
      let temp, letter = '';
      while (colNum > 0) {
        temp = (colNum - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colNum = (colNum - temp - 1) / 26;
      }
      return letter;
    };
`;

content = content.replace(
  "    if (gridData.titleRow) {",
  getColLetterFn + "\n    if (gridData.titleRow) {"
);

content = content.replace(
  "      const getColLetter = (colNum: number) => {\n        let temp, letter = '';\n        while (colNum > 0) {\n          temp = (colNum - 1) % 26;\n          letter = String.fromCharCode(temp + 65) + letter;\n          colNum = (colNum - temp - 1) / 26;\n        }\n        return letter;\n      };\n      worksheet.mergeCells(`A${currentRow}:${getColLetter(gridData.headers.length)}${currentRow}`);",
  "      worksheet.mergeCells(`A${currentRow}:${getColLetter(gridData.headers.length)}${currentRow}`);"
);

const subTitleWorksheetStr = `
    if (gridData.subTitleRow) {
      const subTitleCell = worksheet.getCell(\`A\${currentRow}\`);
      subTitleCell.value = gridData.subTitleRow;
      subTitleCell.font = { size: 12, name: 'Microsoft JhengHei' };
      subTitleCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      worksheet.mergeCells(\`A\${currentRow}:\${getColLetter(gridData.headers.length)}\${currentRow}\`);
      const lines = (gridData.subTitleRow.match(/\\n/g) || []).length + 1;
      worksheet.getRow(currentRow).height = lines * 18 + 10;
      currentRow += 1;
    }
`;

content = content.replace(
  "    // Headers",
  subTitleWorksheetStr + "\n    // Headers"
);

fs.writeFileSync('src/components/Export.tsx', content);
