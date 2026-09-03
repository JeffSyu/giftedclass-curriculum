const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// Add templateTextareaRef and insertTag
const refAndFunc = `  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    if (templateTextareaRef.current) {
      const textarea = templateTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = courseInfoTemplate.substring(0, start) + tag + courseInfoTemplate.substring(end);
      setCourseInfoTemplate(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setCourseInfoTemplate(prev => prev + tag);
    }
  };`;

content = content.replace("  const pdfContainerRef = useRef<HTMLDivElement>(null);", refAndFunc);

// Update textarea to use ref
content = content.replace(
  '<textarea\n                value={courseInfoTemplate}',
  '<textarea\n                ref={templateTextareaRef}\n                value={courseInfoTemplate}'
);

// Update buttons to use insertTag
content = content.replace(
  /onClick=\{\(\) => setCourseInfoTemplate\(prev => prev \+ tag\)\}/g,
  'onClick={() => insertTag(tag)}'
);

fs.writeFileSync('src/components/Export.tsx', content);
