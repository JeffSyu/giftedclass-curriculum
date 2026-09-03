const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Undo the fix_one_div
content = content.replace('    </div>\n    </div>\n    </div>\n  );\n}', '    </div>\n    </div>\n  );\n}');

// Fix the actual double div issue
const target = '          <div className="space-y-3">\n                      <div className="space-y-3">\n            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面方向</h4>';
const replacement = '          <div className="space-y-3">\n            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面方向</h4>';

content = content.replace(target, replacement);

fs.writeFileSync('src/components/Export.tsx', content);
