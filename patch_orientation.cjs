const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Add orientation state
content = content.replace(
  "const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');",
  "const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');\n  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');"
);

// Add layout UI
const layoutUI = `          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面方向</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setOrientation('portrait')}
                className={\`flex-1 py-2 rounded font-bold transition-colors \${orientation === 'portrait' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#D9D4C7] text-[#4A4A3A]'}\`}
              >
                直式
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={\`flex-1 py-2 rounded font-bold transition-colors \${orientation === 'landscape' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#D9D4C7] text-[#4A4A3A]'}\`}
              >
                橫式
              </button>
            </div>
          </div>`;

content = content.replace(
  '<h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">表格配色</h4>',
  layoutUI + '\n\n          <div className="space-y-3">\n            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">表格配色</h4>'
);

fs.writeFileSync('src/components/Export.tsx', content);
