const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldHeightStr = "minHeight: orientation === 'landscape' ? '79px' : '104px'";
const newHeightStr = "minHeight: orientation === 'landscape' ? '79px' : '104px', height: '100%'";
content = content.split(oldHeightStr).join(newHeightStr);

// Preview classes for text sizes
content = content.split("classes.push('text-lg')").join("classes.push('text-[14pt]')");
content = content.split("classes.push('text-xs')").join("classes.push('text-[10pt]')");
content = content.split("className={classes.join(' ')}").join("className={`${classes.join(' ')} text-[12pt]`}");


fs.writeFileSync('src/components/Export.tsx', content);
