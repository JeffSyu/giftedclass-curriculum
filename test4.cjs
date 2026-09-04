const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldTd = "className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`} style={{ borderColor: theme.cssBorder, overflow: 'hidden' }}";
const newTd = "className={`p-1 border border-[#2D2D2A] text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`}";
content = content.split(oldTd).join(newTd);

const oldTh = "className=\"py-3 px-2 border text-center align-middle font-bold text-[14pt]\" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder, width: i === 0 ? '8%' : i === 1 ? '12%' : '16%' }}";
const newTh = "className=\"py-3 px-2 border border-[#2D2D2A] text-center align-middle font-bold text-[14pt]\" style={{ backgroundColor: theme.cssBg, color: theme.cssText, width: i === 0 ? '8%' : i === 1 ? '12%' : '16%' }}";
content = content.split(oldTh).join(newTh);

const oldTh2 = "className=\"py-3 px-2 border text-center align-middle font-bold text-[14px]\"";
const newTh2 = "className=\"py-3 px-2 border border-[#2D2D2A] text-center align-middle font-bold text-[14pt]\"";
content = content.split(oldTh2).join(newTh2);

const oldTd2 = "className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14px] font-bold' : (cIdx === 1 ? 'text-[11pt]' : '')}`} style={{ borderColor: theme.cssBorder, overflow: 'hidden' }}";
const newTd2 = "className={`p-1 border border-[#2D2D2A] text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-[14pt] font-bold' : (cIdx === 1 ? 'text-[11pt]' : 'text-[12pt]')}`}";
content = content.split(oldTd2).join(newTd2);

fs.writeFileSync('src/components/Export.tsx', content);
