const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldTable1 = 'border-2 border-[#2D2D2A]';
const newTable1 = 'border-[3px] border-[#2D2D2A]';
content = content.split(oldTable1).join(newTable1);

fs.writeFileSync('src/components/Export.tsx', content);
