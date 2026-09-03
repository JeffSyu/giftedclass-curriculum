const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// The file has some weird ending. Let's just restore from 1170 to end.
content = content.substring(0, content.lastIndexOf('  );\n}'));
content += '  );\n}\n';

fs.writeFileSync('src/components/Export.tsx', content);
