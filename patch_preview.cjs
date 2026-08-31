const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(
  "const renderTimetableTable = (gridData: { titleRow?: string; headers: string[]; rows: string[][]; footer?: string }) => {",
  "const renderTimetableTable = (gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; footer?: string }) => {"
);

content = content.replace(
  "{gridData.titleRow && <h2 className=\"text-2xl font-bold text-center mb-6 text-[#2D2D2A]\">{gridData.titleRow}</h2>}",
  "{gridData.titleRow && <h2 className=\"text-2xl font-bold text-center mb-6 text-[#2D2D2A]\">{gridData.titleRow}</h2>}\n        {gridData.subTitleRow && <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed\">{gridData.subTitleRow}</div>}"
);

// We should also replace the preview when all sheets are generated (the multi-sheet preview)
content = content.replace(
  "{item.gridData.titleRow && (\n              <h2 className=\"text-2xl font-bold text-center mb-6 text-[#2D2D2A]\">\n                {item.gridData.titleRow}\n              </h2>\n            )}",
  "{item.gridData.titleRow && (\n              <h2 className=\"text-2xl font-bold text-center mb-6 text-[#2D2D2A]\">\n                {item.gridData.titleRow}\n              </h2>\n            )}\n            {item.gridData.subTitleRow && (\n              <div className=\"text-sm text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed\">\n                {item.gridData.subTitleRow}\n              </div>\n            )}"
);

fs.writeFileSync('src/components/Export.tsx', content);
