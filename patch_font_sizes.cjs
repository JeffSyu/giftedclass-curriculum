const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// For UI table TH
content = content.replace(
  'className="py-3 px-4 border text-center font-bold" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder }}>',
  'className="py-3 px-4 border text-center font-bold text-base" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder }}>'
);

// For UI table TD
content = content.replace(
  'className="py-3 px-4 border text-center align-middle whitespace-pre-wrap leading-relaxed text-[#2D2D2A]" style={{ borderColor: theme.cssBorder }}>',
  'className={`py-3 px-4 border text-center align-middle whitespace-pre-wrap leading-relaxed text-[#2D2D2A] ${cIdx === 0 ? \'text-base font-bold\' : \'\'}`} style={{ borderColor: theme.cssBorder }}>'
);

// For PDF preview TD
content = content.replace(
  'className="py-3 px-3 border text-center align-middle whitespace-pre-wrap leading-relaxed text-sm text-[#2D2D2A]"',
  'className={`py-3 px-3 border text-center align-middle whitespace-pre-wrap leading-relaxed text-[#2D2D2A] ${cIdx === 0 ? \'text-base font-bold\' : \'text-sm\'}`}'
);

fs.writeFileSync('src/components/Export.tsx', content);
