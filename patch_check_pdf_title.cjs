const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldPdfTitle = 'className="text-[16pt] font-bold text-center mb-6 text-[#2D2D2A]"';
const newPdfTitle = 'className="text-[16pt] font-bold text-center mb-6 text-[#2D2D2A]"';
content = content.split(oldPdfTitle).join(newPdfTitle);

fs.writeFileSync('src/components/Export.tsx', content);
