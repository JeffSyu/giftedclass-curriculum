const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// For cell vertical centering for all cells (time block was top instead of middle for excel)
const oldAlign = "cell.alignment = { horizontal: 'center', vertical: i < 2 ? 'middle' : 'top', wrapText: true };";
const newAlign = "cell.alignment = { horizontal: 'center', vertical: i < 2 ? 'middle' : 'top', wrapText: true };"; // Actually wait, the user asked for:
// "表格首列資訊、節次(時段)名稱、時間確保文字垂直置中" -> this corresponds to row headers and columns 0 and 1, which are already middle.
// "課程資訊文字內容靠上" -> this corresponds to column >= 2, which is already top.
// So no change is needed there.

fs.writeFileSync('src/components/Export.tsx', content);
