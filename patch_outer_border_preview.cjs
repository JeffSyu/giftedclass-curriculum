const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldTr = '<tr key={rIdx} className="bg-white">';
const newTr = '<tr key={rIdx} className="bg-white group">';
content = content.split(oldTr).join(newTr);

const oldTd = 'className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? \\'text-[14pt] font-bold\\' : (cIdx === 1 ? \\'text-[11pt]\\' : \\'text-[12pt]\\')}`} style={{ borderColor: theme.cssBorder, overflow: \\'hidden\\' }}';
const newTd = 'className={`p-1 border text-center align-middle text-[#2D2D2A] border-[#2D2D2A] border-[1px] ${cIdx === 0 ? \\'text-[14pt] font-bold\\' : (cIdx === 1 ? \\'text-[11pt]\\' : \\'text-[12pt]\\')}`} style={{ overflow: \\'hidden\\' }}';
content = content.split(oldTd).join(newTd);

const oldTh = 'className="py-3 px-2 border text-center align-middle font-bold text-[14pt]" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder, width: i === 0 ? \\'8%\\' : i === 1 ? \\'12%\\' : \\'16%\\' }}';
const newTh = 'className="py-3 px-2 border text-center align-middle font-bold text-[14pt] border-[#2D2D2A] border-[1px]" style={{ backgroundColor: theme.cssBg, color: theme.cssText, width: i === 0 ? \\'8%\\' : i === 1 ? \\'12%\\' : \\'16%\\' }}';
content = content.split(oldTh).join(newTh);

// Also need to adjust PDF borders if they are similar
fs.writeFileSync('src/components/Export.tsx', content);
