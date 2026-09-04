const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldHeightStr = "minHeight: orientation === 'landscape' ? '79px' : '104px', height: '100%'";
const newHeightStr = "minHeight: orientation === 'landscape' ? '79px' : '104px', height: '100%'";
content = content.split(oldHeightStr).join(newHeightStr);

fs.writeFileSync('src/components/Export.tsx', content);
