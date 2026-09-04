const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldTable1 = 'className="border-collapse shadow-sm text-[12pt] mx-auto border-2" style={{ tableLayout: \'fixed\'';
const newTable1 = 'className="border-collapse shadow-sm text-[12pt] mx-auto border-2 border-[#2D2D2A]" style={{ tableLayout: \'fixed\'';
content = content.split(oldTable1).join(newTable1);

const oldTable2 = 'className="border-collapse text-[12pt] mx-auto border-2" style={{ tableLayout: \'fixed\'';
const newTable2 = 'className="border-collapse text-[12pt] mx-auto border-2 border-[#2D2D2A]" style={{ tableLayout: \'fixed\'';
content = content.split(oldTable2).join(newTable2);

fs.writeFileSync('src/components/Export.tsx', content);
