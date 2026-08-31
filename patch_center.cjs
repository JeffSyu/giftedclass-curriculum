const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Center in Excel export
content = content.replace(
  "subTitleCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };",
  "subTitleCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };"
);

// Center in preview 1
content = content.replace(
  "{gridData.subTitleRow && <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed\">{gridData.subTitleRow}</div>}",
  "{gridData.subTitleRow && <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">{gridData.subTitleRow}</div>}"
);

// Center in preview 2
content = content.replace(
  "<div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed\">\n                {item.gridData.subTitleRow}\n              </div>",
  "<div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center\">\n                {item.gridData.subTitleRow}\n              </div>"
);

fs.writeFileSync('src/components/Export.tsx', content);
