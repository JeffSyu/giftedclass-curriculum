const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldThPdf = "className=\"py-3 px-2 border text-center align-middle font-bold text-[14pt]\"\n                      style={{ \n                        backgroundColor: THEMES[selectedTheme].cssBg, \n                        color: THEMES[selectedTheme].cssText, \n                        borderColor: THEMES[selectedTheme].cssBorder,";
const newThPdf = "className=\"py-3 px-2 border border-[#2D2D2A] border-[1px] text-center align-middle font-bold text-[14pt]\"\n                      style={{ \n                        backgroundColor: THEMES[selectedTheme].cssBg, \n                        color: THEMES[selectedTheme].cssText, ";
content = content.split(oldThPdf).join(newThPdf); 

const oldTdPdf = "className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`}\n                        style={{ borderColor: THEMES[selectedTheme].cssBorder, overflow: 'hidden' }}";
const newTdPdf = "className={`p-1 border border-[#2D2D2A] border-[1px] text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`}\n                        style={{ overflow: 'hidden' }}";
content = content.split(oldTdPdf).join(newTdPdf);

fs.writeFileSync('src/components/Export.tsx', content);
