const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');


const oldFooterLogic = "if (gridData.footerLeft || gridData.footerRight) {";
const newFooterLogic = `
    // Add thick outer border to the table
    let tableStartRow = 1;
    for (let i = 1; i < currentRow; i++) {
        const firstCell = worksheet.getCell('A' + i);
        if (firstCell.value === gridData.headers[0]) {
            tableStartRow = i;
            break;
        }
    }
    const tableEndRow = tableStartRow + gridData.rows.length;
    
    for (let r = tableStartRow; r <= tableEndRow; r++) {
        for (let c = 1; c <= gridData.headers.length; c++) {
            const cell = worksheet.getCell(r, c);
            const currentBorder = cell.border || {};
            cell.border = {
                ...currentBorder,
                top: r === tableStartRow ? { style: 'medium', color: { argb: themeColor.border } } : currentBorder.top,
                bottom: r === tableEndRow ? { style: 'medium', color: { argb: themeColor.border } } : currentBorder.bottom,
                left: c === 1 ? { style: 'medium', color: { argb: themeColor.border } } : currentBorder.left,
                right: c === gridData.headers.length ? { style: 'medium', color: { argb: themeColor.border } } : currentBorder.right,
            };
        }
    }

    if (gridData.footerLeft || gridData.footerRight) {`;

content = content.replace(oldFooterLogic, newFooterLogic);


// PDF styles
const oldPdfHeaderTh = 'className="py-3 px-2 border text-center align-middle font-bold text-base"';
const newPdfHeaderTh = 'className="py-3 px-2 border text-center align-middle font-bold text-[14px]"';
content = content.split(oldPdfHeaderTh).join(newPdfHeaderTh); 

const oldTitle = '<h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">{gridData.titleRow}</h2>';
const newTitle = '<h2 className="text-[16pt] font-bold text-center mb-6 text-[#2D2D2A]">{gridData.titleRow}</h2>';
content = content.split(oldTitle).join(newTitle); 

// we also need to change the item.gridData.titleRow
const oldTitle2 = '<h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">';
const newTitle2 = '<h2 className="text-[16pt] font-bold text-center mb-6 text-[#2D2D2A]">';
content = content.split(oldTitle2).join(newTitle2);

const oldPreviewTable = 'className="border-collapse shadow-sm text-sm mx-auto"';
const newPreviewTable = 'className="border-collapse shadow-sm text-[12pt] mx-auto border-2"';
content = content.split(oldPreviewTable).join(newPreviewTable);

const oldPdfTable = 'className="border-collapse text-sm mx-auto"';
const newPdfTable = 'className="border-collapse text-[12pt] mx-auto border-2"';
content = content.split(oldPdfTable).join(newPdfTable);

const oldCell = '<td key={cIdx} className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \'text-base font-bold\' : \'\'}`';
const newCell = '<td key={cIdx} className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \'text-[14px] font-bold\' : (cIdx === 1 ? \'text-[11pt]\' : \'\')}`';
content = content.split(oldCell).join(newCell);

const oldPdfCell = '<td \n                        key={cIdx} \n                        className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \'text-base font-bold\' : \'\'}`';
const newPdfCell = '<td \n                        key={cIdx} \n                        className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \'text-[14px] font-bold\' : (cIdx === 1 ? \'text-[11pt]\' : \'\')}`';
content = content.split(oldPdfCell).join(newPdfCell);

fs.writeFileSync('src/components/Export.tsx', content);
