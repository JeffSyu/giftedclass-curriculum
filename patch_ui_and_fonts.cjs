const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Update UI for showEntityName
const uiRegex = /<label className="flex items-center gap-3 p-3 bg-white border border-\[#D9D4C7\] rounded-lg cursor-pointer">\n\s*<input type="checkbox" checked=\{showEntityName\} onChange=\{e => setShowEntityName\(e\.target\.checked\)\} className="rounded text-\[#5A5A40\] focus:ring-\[#5A5A40\] border-\[#D9D4C7\]" \/>\n\s*<span className="text-sm font-medium text-\[#2D2D2A\]">顯示名稱 \(置於表尾左下方\)<\/span>\n\s*<\/label>/;
const uiNew = `<div className="flex flex-col gap-2 p-3 bg-white border border-[#D9D4C7] rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showEntityName} onChange={e => setShowEntityName(e.target.checked)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                <span className="text-sm font-medium text-[#2D2D2A]">顯示名稱</span>
              </label>
              {showEntityName && (
                <div className="pl-7 mt-1">
                  <select 
                    value={entityNamePosition}
                    onChange={e => setEntityNamePosition(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm bg-[#F9F8F4] border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] outline-none text-[#4A4A3A]"
                  >
                    <option value="top-left">表頭左上</option>
                    <option value="top-right">表頭右上</option>
                    <option value="bottom-left">表尾左下</option>
                    <option value="bottom-right">表尾右下</option>
                  </select>
                </div>
              )}
            </div>`;
content = content.replace(uiRegex, uiNew);

// 2. React UI Font size adjustments
// Make header (th) font size text-base instead of inheriting text-sm
const thRegex = /<th key=\{i\} className="border border-\[#D9D4C7\] px-3 py-2 text-center align-middle whitespace-nowrap bg-\[#F4F3F0\] font-bold text-\[#4A4A3A\]" style=\{theme\.headerStyle\}>\{h\}<\/th>/g;
const thNew = `<th key={i} className="border border-[#D9D4C7] px-3 py-2 text-center align-middle whitespace-nowrap bg-[#F4F3F0] font-bold text-[#4A4A3A] text-base" style={theme.headerStyle}>{h}</th>`;
content = content.replace(thRegex, thNew);

// Make the first column in the body text-base font-bold
const tdRegex = /<td key=\{cIdx\} className="border border-\[#E5E1D5\] px-2 py-3 text-center align-middle whitespace-pre-wrap text-\[#2D2D2A\]" style=\{cIdx < 2 \? theme\.firstColumnStyle : \{\}\}>\n\s*\{cell\}\n\s*<\/td>/g;
const tdNew = `<td key={cIdx} className={\`border border-[#E5E1D5] px-2 py-3 text-center align-middle whitespace-pre-wrap text-[#2D2D2A] \${cIdx === 0 ? 'text-base font-bold' : ''}\`} style={cIdx < 2 ? theme.firstColumnStyle : {}}>
                    {cell}
                  </td>`;
content = content.replace(tdRegex, tdNew);

// 3. Excel UI Font size adjustments
// Title font is already 16. We can make it 18.
content = content.replace(
  "titleCell.font = { name: 'Microsoft JhengHei', bold: true, size: 16 };",
  "titleCell.font = { name: 'Microsoft JhengHei', bold: true, size: 18 };"
);

// Header fonts, change size: 12
content = content.replace(
  "cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei' };",
  "cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei', size: 12 };"
);

// Body cells fonts. Make first column bold and size 12
const cellFontOld = "cell.font = { name: 'Microsoft JhengHei' };";
const cellFontNew = "cell.font = { name: 'Microsoft JhengHei', bold: c === 1, size: c === 1 ? 12 : 11 };";
content = content.replace(cellFontOld, cellFontNew);

fs.writeFileSync('src/components/Export.tsx', content);
