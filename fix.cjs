const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');
content = content.replace("    }\n    } else if (exportType === 'attendance') {", "    } else if (exportType === 'attendance') {");
fs.writeFileSync('src/components/Export.tsx', content);
