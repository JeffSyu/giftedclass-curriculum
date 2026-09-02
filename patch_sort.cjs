const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldSort = `    }).sort((a, b) => {
      if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
      return a.name.localeCompare(b.name);
    });`;

const newSort = `    }).sort((a, b) => {
      if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
      const numA = parseInt(a.name) || 0;
      const numB = parseInt(b.name) || 0;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });`;

content = content.replace(oldSort, newSort);
fs.writeFileSync('src/components/Export.tsx', content);
