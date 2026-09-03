const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const oldPdfTable = /<table className="w-full border-collapse text-sm">([\s\S]*?)<\/table>/;
const newPdfTable = `<table className="border-collapse text-sm mx-auto" style={{ tableLayout: 'fixed', width: orientation === 'landscape' ? '1000px' : '700px' }}>
              <thead>
                <tr>
                  {item.gridData.headers.map((h, hIdx) => (
                    <th 
                      key={hIdx} 
                      className="py-3 px-2 border text-center font-bold text-base"
                      style={{ 
                        backgroundColor: THEMES[selectedTheme].cssBg, 
                        color: THEMES[selectedTheme].cssText, 
                        borderColor: THEMES[selectedTheme].cssBorder,
                        width: hIdx === 0 ? '8%' : hIdx === 1 ? '12%' : '16%'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.gridData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white">
                    {row.map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className={\`p-1 border text-center align-middle text-[#2D2D2A] \${cIdx === 0 ? 'text-base font-bold' : ''}\`}
                        style={{ borderColor: THEMES[selectedTheme].cssBorder, overflow: 'hidden' }}
                      >
                        <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {renderReactRichText(cell)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>`;

content = content.replace(oldPdfTable, newPdfTable);

fs.writeFileSync('src/components/Export.tsx', content);
