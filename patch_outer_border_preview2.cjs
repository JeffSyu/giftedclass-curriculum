const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldTd = "style={{ borderColor: theme.cssBorder, overflow: 'hidden' }}";
const newTd = "style={{ borderColor: '#2D2D2A', overflow: 'hidden' }}"; // Set internal border colors to black for preview too, matching Excel if needed.
// Wait, the user asked for "表格增加粗外框". We already added "border-[3px] border-[#2D2D2A]" to the table element. This is the thick outer border for the preview.
// For the PDF we should also ensure border-width: 3px.

fs.writeFileSync('src/components/Export.tsx', content);
