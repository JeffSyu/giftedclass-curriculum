const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Patch PDF margin
const oldPdfMargin = "const margin = 10;";
const newPdfMargin = "const margin = 6.35; // Narrow margin (~0.25 inches)";
content = content.split(oldPdfMargin).join(newPdfMargin);

// Patch Excel pageSetup margins
const oldPageSetup = "worksheet.pageSetup.orientation = orientation;";
const newPageSetup = "worksheet.pageSetup.orientation = orientation;\n    worksheet.pageSetup.margins = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }; // Narrow margins";
content = content.split(oldPageSetup).join(newPageSetup);

fs.writeFileSync('src/components/Export.tsx', content);
