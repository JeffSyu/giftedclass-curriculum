const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Replace showEntityName state to include entityNamePosition
content = content.replace(
  "const [showEntityName, setShowEntityName] = useState(true);",
  "const [showEntityName, setShowEntityName] = useState(true);\n  const [entityNamePosition, setEntityNamePosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-left');"
);

// 2. Change getAllExportGridData return type
content = content.replace(
  "const result: { title: string; filename: string; gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; footer?: string; } }[] = [];",
  "const result: { title: string; filename: string; gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; headerLeft?: string; headerRight?: string; footerLeft?: string; footerRight?: string; } }[] = [];"
);

// 3. Update return object in generateAttendanceGridData
const attendanceFooterStr = "footer: showEntityName ? `課程名稱：${course.name}` : undefined";
const attendanceNewStr = `      headerLeft: showEntityName && entityNamePosition === 'top-left' ? \`課程名稱：\${course.name}\` : undefined,
      headerRight: showEntityName && entityNamePosition === 'top-right' ? \`課程名稱：\${course.name}\` : undefined,
      footerLeft: showEntityName && entityNamePosition === 'bottom-left' ? \`課程名稱：\${course.name}\` : undefined,
      footerRight: showEntityName && entityNamePosition === 'bottom-right' ? \`課程名稱：\${course.name}\` : undefined`;
content = content.replace(attendanceFooterStr, attendanceNewStr);

// 4. Update return object in generateGridData
const gridDataFooterStr = "footer: showEntityName ? `${entityTypeLabel}：${entityName}` : undefined";
const gridDataNewStr = `      headerLeft: showEntityName && entityNamePosition === 'top-left' ? \`\${entityTypeLabel}：\${entityName}\` : undefined,
      headerRight: showEntityName && entityNamePosition === 'top-right' ? \`\${entityTypeLabel}：\${entityName}\` : undefined,
      footerLeft: showEntityName && entityNamePosition === 'bottom-left' ? \`\${entityTypeLabel}：\${entityName}\` : undefined,
      footerRight: showEntityName && entityNamePosition === 'bottom-right' ? \`\${entityTypeLabel}：\${entityName}\` : undefined`;
content = content.replace(gridDataFooterStr, gridDataNewStr);

// 5. Update buildWorksheet logic
const headersRegex = /    \/\/ Headers/;
const headerLeftRightStr = `    if (gridData.headerLeft || gridData.headerRight) {
      if (gridData.headerLeft) {
        const hCell = worksheet.getCell(\`A\${currentRow}\`);
        hCell.value = gridData.headerLeft;
        hCell.font = { name: 'Microsoft JhengHei', bold: true };
        hCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (gridData.headerRight) {
        const lastCol = getColLetter(gridData.headers.length);
        const hCell = worksheet.getCell(\`\${lastCol}\${currentRow}\`);
        hCell.value = gridData.headerRight;
        hCell.font = { name: 'Microsoft JhengHei', bold: true };
        hCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      currentRow += 1;
    }
`;
content = content.replace(headersRegex, headerLeftRightStr + "    // Headers");

const footerRegex = /    if \(gridData\.footer\) \{\n      currentRow\+\+; \/\/ empty row\n      const footerCell = worksheet\.getCell\(`A\$\{currentRow\}`\);\n      footerCell\.value = gridData\.footer;\n      footerCell\.font = \{ name: 'Microsoft JhengHei', bold: true \};\n    \}/;
const footerLeftRightStr = `    if (gridData.footerLeft || gridData.footerRight) {
      currentRow++; // empty row
      if (gridData.footerLeft) {
        const fCell = worksheet.getCell(\`A\${currentRow}\`);
        fCell.value = gridData.footerLeft;
        fCell.font = { name: 'Microsoft JhengHei', bold: true };
        fCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (gridData.footerRight) {
        const lastCol = getColLetter(gridData.headers.length);
        const fCell = worksheet.getCell(\`\${lastCol}\${currentRow}\`);
        fCell.value = gridData.footerRight;
        fCell.font = { name: 'Microsoft JhengHei', bold: true };
        fCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }`;
content = content.replace(footerRegex, footerLeftRightStr);

// 6. Update renderTimetableTable definition and rendering
const renderTimetableRegex = /const renderTimetableTable = \(gridData: \{ titleRow\?: string; subTitleRow\?: string; headers: string\[\]; rows: string\[\]\[\]; footer\?: string \}\) => \{/;
const renderTimetableNew = `const renderTimetableTable = (gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; headerLeft?: string; headerRight?: string; footerLeft?: string; footerRight?: string; }) => {`;
content = content.replace(renderTimetableRegex, renderTimetableNew);

const renderReactHeaderRegex = /<table className="w-full border-collapse min-w-\[700px\] shadow-sm text-sm">/;
const renderReactHeaderNew = `{(gridData.headerLeft || gridData.headerRight) && (
          <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mb-2 px-1">
            <div>{gridData.headerLeft}</div>
            <div>{gridData.headerRight}</div>
          </div>
        )}
        <table className="w-full border-collapse min-w-[700px] shadow-sm text-sm">`;
content = content.replace(renderReactHeaderRegex, renderReactHeaderNew);

const renderReactFooterRegex = /\{gridData\.footer && <div className="mt-4 font-bold text-sm text-\[#4A4A3A\]">\{gridData\.footer\}<\/div>\}/;
const renderReactFooterNew = `{(gridData.footerLeft || gridData.footerRight) && (
          <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mt-4 px-1">
            <div>{gridData.footerLeft}</div>
            <div>{gridData.footerRight}</div>
          </div>
        )}`;
content = content.replace(renderReactFooterRegex, renderReactFooterNew);

// 7. Update PDF preview rendering
const pdfFooterRegex = /\{item\.gridData\.footer && \(\n              <div className="mt-4 font-bold text-sm text-\[#4A4A3A\]">\n                \{item\.gridData\.footer\}\n              <\/div>\n            \)}/;
const pdfFooterNew = `{(item.gridData.footerLeft || item.gridData.footerRight) && (
              <div className="flex justify-between mt-4 font-bold text-sm text-[#4A4A3A] px-1">
                <div>{item.gridData.footerLeft}</div>
                <div>{item.gridData.footerRight}</div>
              </div>
            )}`;
content = content.replace(pdfFooterRegex, pdfFooterNew);

const pdfHeaderRegex = /<table className="w-full border-collapse text-sm">/;
const pdfHeaderNew = `{(item.gridData.headerLeft || item.gridData.headerRight) && (
              <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mb-2 px-1">
                <div>{item.gridData.headerLeft}</div>
                <div>{item.gridData.headerRight}</div>
              </div>
            )}
            <table className="w-full border-collapse text-sm">`;
content = content.replace(pdfHeaderRegex, pdfHeaderNew);

fs.writeFileSync('src/components/Export.tsx', content);
