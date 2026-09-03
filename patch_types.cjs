const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(
  "let currentState = { bold: false, italic: false, underline: false, size: 'normal' as const };",
  "let currentState = { bold: false, italic: false, underline: false, size: 'normal' as 'normal' | 'large' | 'small' };"
);

fs.writeFileSync('src/components/Export.tsx', content);
