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

content = content.replace("export default function ExportView", parseRichTextDefs + "\nexport default function ExportView");

fs.writeFileSync('src/components/Export.tsx', content);
