const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldStr = `paddingTop: cIdx < 2 ? '0' : '2px', `;
content = content.split(oldStr).join('');

fs.writeFileSync('src/components/Export.tsx', content);
