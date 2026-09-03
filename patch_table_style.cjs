const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// The string to replace in renderTimetableTable
const renderTimetableRegex = /<table className="w-full border-collapse min-w-\[700px\] shadow-sm text-sm">([\s\S]*?)<\/table>/;

const newTableCode = `<table className="border-collapse shadow-sm text-sm mx-auto" style={{ tableLayout: 'fixed', width: orientation === 'landscape' ? '1000px' : '700px' }}>
          <thead>
            <tr>
              {gridData.headers.map((h, i) => (
                <th key={i} className="py-3 px-2 border text-center font-bold text-base" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder, width: i === 0 ? '8%' : i === 1 ? '12%' : '16%' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="bg-white">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className={\`p-1 border text-center align-middle text-[#2D2D2A] \${cIdx === 0 ? 'text-base font-bold' : ''}\`} style={{ borderColor: theme.cssBorder, overflow: 'hidden' }}>
                    <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderReactRichText(cell)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>`;

content = content.replace(renderTimetableRegex, newTableCode);

fs.writeFileSync('src/components/Export.tsx', content);
