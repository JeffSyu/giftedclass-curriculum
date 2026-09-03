const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(/<div className="space-y-3">\s*<div className="space-y-3">\s*<h4 className="text-sm font-bold text-\\[#8A8475\\] uppercase tracking-wider">版面方向<\/h4>/,
  '<div className="space-y-3">\n            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面方向</h4>');

fs.writeFileSync('src/components/Export.tsx', content);
