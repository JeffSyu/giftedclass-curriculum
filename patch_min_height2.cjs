const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldHeightStr = 'minHeight: orientation === \\'landscape\\' ? \\'79px\\' : \\'104px\\'';
// Just removing overflow hidden isn't enough, we need to ensure height uses 100% and min-height is set correctly on the div 
// Wait, the div currently has minHeight, which is correct.
// Let's change minHeight to minimum px values as requested:
const newHeightStr = 'minHeight: orientation === \\'landscape\\' ? \\'79px\\' : \\'104px\\', height: \\'100%\\'';
content = content.split(oldHeightStr).join(newHeightStr);

fs.writeFileSync('src/components/Export.tsx', content);
