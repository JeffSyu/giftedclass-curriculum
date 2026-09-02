const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

const parseRichTextDefs = `
interface RichTextChunk {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  size: 'normal' | 'large' | 'small';
}

const parseStyledText = (input: string): RichTextChunk[] => {
  if (!input) return [];
  const regex = /(\\[粗體\\]|\\[斜體\\]|\\[底線\\]|\\[大字體\\]|\\[小字體\\]|\\[預設\\])/g;
  const parts = input.split(regex);
  
  let currentState = { bold: false, italic: false, underline: false, size: 'normal' as const };
  const chunks: RichTextChunk[] = [];
  
  parts.forEach(part => {
    if (!part) return;
    switch (part) {
      case '[粗體]': currentState.bold = true; break;
      case '[斜體]': currentState.italic = true; break;
      case '[底線]': currentState.underline = true; break;
      case '[大字體]': currentState.size = 'large'; break;
      case '[小字體]': currentState.size = 'small'; break;
      case '[預設]': 
        currentState = { bold: false, italic: false, underline: false, size: 'normal' }; 
        break;
      default:
        chunks.push({
          text: part,
          bold: currentState.bold,
          italic: currentState.italic,
          underline: currentState.underline,
          size: currentState.size
        });
    }
  });
  return chunks;
};

const renderReactRichText = (input: string) => {
  if (!/\\[(粗體|斜體|底線|大字體|小字體|預設)\\]/.test(input)) return input;
  
  const chunks = parseStyledText(input);
  return (
    <>
      {chunks.map((chunk, i) => {
        let classes = [];
        if (chunk.bold) classes.push('font-bold');
        if (chunk.italic) classes.push('italic');
        if (chunk.underline) classes.push('underline');
        if (chunk.size === 'large') classes.push('text-lg');
        else if (chunk.size === 'small') classes.push('text-xs');
        
        return <span key={i} className={classes.join(' ')}>{chunk.text}</span>;
      })}
    </>
  );
};

const getExcelRichText = (input: string, baseFontName = 'Microsoft JhengHei', isFirstCol = false) => {
  if (!/\\[(粗體|斜體|底線|大字體|小字體|預設)\\]/.test(input)) {
    return input;
  }
  
  const chunks = parseStyledText(input);
  const baseSize = isFirstCol ? 12 : 11;
  const baseBold = isFirstCol;
  
  return {
    richText: chunks.map(chunk => {
      let size = baseSize;
      if (chunk.size === 'large') size = baseSize + 3;
      if (chunk.size === 'small') size = baseSize - 2;
      
      return {
        text: chunk.text,
        font: {
          name: baseFontName,
          size: size,
          bold: baseBold || chunk.bold,
          italic: chunk.italic,
          underline: chunk.underline ? true : false,
        }
      };
    })
  };
};
`;

// Insert definitions after imports
content = content.replace("export default function Export() {", parseRichTextDefs + "\nexport default function Export() {");

// Add styleTags
const styleTagsDef = "const styleTags = ['[粗體]', '[斜體]', '[底線]', '[大字體]', '[小字體]', '[預設]'];";
content = content.replace(
  "const templateTags = ['[課程名稱]', '[年級]', '[類別]', '[教師]', '[教室]', '[學生]'];",
  "const templateTags = ['[課程名稱]', '[年級]', '[類別]', '[教師]', '[教室]', '[學生]'];\n  " + styleTagsDef
);

// Add style tags to UI
const uiTemplateTagsRegex = /\{templateTags\.map\(tag => \([\s\S]*?<\/button>\n\s*\)\)\}/;
const uiTemplateTagsNew = `{templateTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setCourseInfoTemplate(prev => prev + tag)}
                    className="px-2 py-1 text-xs font-medium bg-white border border-[#D9D4C7] text-[#5A5A40] rounded hover:bg-[#E5E1D5] hover:text-[#4A4A3A] transition-colors shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
                <div className="w-full h-px bg-[#D9D4C7] my-1" />
                {styleTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setCourseInfoTemplate(prev => prev + tag)}
                    className="px-2 py-1 text-xs font-medium bg-white border border-[#D9D4C7] text-[#5A5A40] rounded hover:bg-[#E5E1D5] hover:text-[#4A4A3A] transition-colors shadow-sm"
                  >
                    {tag}
                  </button>
                ))}`;
content = content.replace(uiTemplateTagsRegex, uiTemplateTagsNew);

// Replace cell rendering in UI table
content = content.replace(
  "{cell}\n                  </td>",
  "{renderReactRichText(cell)}\n                  </td>"
);
content = content.replace(
  "{cell}\n                      </td>",
  "{renderReactRichText(cell)}\n                      </td>"
);

// Fix Excel JS cell bug and use rich text
const excelCellOld = `        cell.value = val;
        cell.font = { name: 'Microsoft JhengHei', bold: c === 1, size: c === 1 ? 12 : 11 };`;
const excelCellNew = `        if (typeof val === 'string' && /\\[(粗體|斜體|底線|大字體|小字體|預設)\\]/.test(val)) {
          cell.value = getExcelRichText(val, 'Microsoft JhengHei', i === 0);
        } else {
          cell.value = val;
        }
        if (!cell.value || typeof cell.value !== 'object' || !('richText' in cell.value)) {
          cell.font = { name: 'Microsoft JhengHei', bold: i === 0, size: i === 0 ? 12 : 11 };
        }`;
content = content.replace(excelCellOld, excelCellNew);

fs.writeFileSync('src/components/Export.tsx', content);
