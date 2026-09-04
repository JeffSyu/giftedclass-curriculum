const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldHeight = "height: orientation === 'landscape' ? '50px' : '80px'";
const newHeight = "minHeight: orientation === 'landscape' ? '79px' : '104px'";
content = content.split(oldHeight).join(newHeight);

// Also remove \`overflow: 'hidden'\` so height can grow
const oldOverflow = "overflow: 'hidden', display: cIdx < 2 ? 'flex' : 'block'";
const newOverflow = "display: cIdx < 2 ? 'flex' : 'block'";
content = content.split(oldOverflow).join(newOverflow);

fs.writeFileSync('src/components/Export.tsx', content);
