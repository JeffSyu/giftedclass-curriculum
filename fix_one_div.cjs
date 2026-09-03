const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Insert a </div> before the final JSX element close.
content = content.replace(/    <\/div>\s*<\/div>\s*\);\s*\}/, '    </div>\n    </div>\n    </div>\n  );\n}');

fs.writeFileSync('src/components/Export.tsx', content);
