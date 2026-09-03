const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// replace space in displayName
content = content.replace(
  "const displayName = prefix ? `${prefix} ${student.name}` : student.name;",
  "const displayName = prefix ? `${prefix}${student.name}` : student.name;"
);

// replace space in listData map
content = content.replace(
  "name: prefix ? `${prefix} ${s.name}` : s.name",
  "name: prefix ? `${prefix}${s.name}` : s.name"
);

fs.writeFileSync('src/components/Export.tsx', content);
