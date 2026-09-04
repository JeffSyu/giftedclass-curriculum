const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldPdfCell2 = "className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14px] font-bold' : (cIdx === 1 ? 'text-[11pt]' : '')}`";
const newPdfCell2 = "className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`";
content = content.split(oldPdfCell2).join(newPdfCell2);

const oldPdfHeaderTh2 = 'text-[14px]';
const newPdfHeaderTh2 = 'text-[14pt]';
content = content.split(oldPdfHeaderTh2).join(newPdfHeaderTh2); 


fs.writeFileSync('src/components/Export.tsx', content);
