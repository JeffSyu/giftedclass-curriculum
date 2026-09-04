const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldRichText = `        return <span key={i} className={\`\${classes.join(' ')} text-[12pt]\`}>{chunk.text}</span>;`;
const newRichText = `        if (chunk.size !== 'large' && chunk.size !== 'small') classes.push('text-[12pt]');
        return <span key={i} className={classes.join(' ')}>{chunk.text}</span>;`;
content = content.split(oldRichText).join(newRichText);

fs.writeFileSync('src/components/Export.tsx', content);
