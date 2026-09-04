const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldPdfTable = 'className="border-collapse text-[12pt] mx-auto border-[3px] border-[#2D2D2A]" style={{ tableLayout: \\'fixed\\', width: orientation === \\'landscape\\' ? \\'1000px\\' : \\'700px\\' }}';
const newPdfTable = 'className="border-collapse text-[12pt] mx-auto border-[3px] border-[#2D2D2A]" style={{ tableLayout: \\'fixed\\', width: orientation === \\'landscape\\' ? \\'1000px\\' : \\'700px\\' }}';
// Let's replace the actual html string used for PDF
const oldPdfHeaderTh3 = '<th \\n                      key={hIdx} \\n                      className="py-3 px-2 border border-[#2D2D2A] text-center align-middle font-bold text-[14pt]"';
const newPdfHeaderTh3 = '<th \\n                      key={hIdx} \\n                      className="py-3 px-2 border border-[#2D2D2A] border-[1px] text-center align-middle font-bold text-[14pt]"';
content = content.split(oldPdfHeaderTh3).join(newPdfHeaderTh3); 

const oldPdfCell3 = 'className={`p-1 border border-[#2D2D2A] text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \\'text-[14pt] font-bold\\' : (cIdx === 1 ? \\'text-[11pt]\\' : \\'text-[12pt]\\')}`}';
const newPdfCell3 = 'className={`p-1 border border-[#2D2D2A] border-[1px] text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \\'text-[14pt] font-bold\\' : (cIdx === 1 ? \\'text-[11pt]\\' : \\'text-[12pt]\\')}`}';
content = content.split(oldPdfCell3).join(newPdfCell3);


fs.writeFileSync('src/components/Export.tsx', content);
