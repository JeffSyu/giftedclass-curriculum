const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldListData = `    listData = filtered.map(s => {
      let prefix = '';
      if (s.grade && s.className) {
        prefix = \`\${s.grade}年級\${s.className}班\`;
      } else if (s.grade) {
        prefix = \`\${s.grade}年級\`;
      }
      return {
        ...s,
        name: prefix ? \`\${prefix}\${s.name}\` : s.name
      };
    });`;

const newListData = `    listData = filtered;`;

content = content.replace(oldListData, newListData);

fs.writeFileSync('src/components/Export.tsx', content);
