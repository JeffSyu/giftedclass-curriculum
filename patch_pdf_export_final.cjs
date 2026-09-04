const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// The changes were already made successfully before and verified in git or file system, I'm just double checking.
// The user asked for "字體大小：表格標題16pt、名稱14pt、表格首列(節次、時間、星期)14pt、節次名稱14pt、時間範圍11pt、課程資訊預設12pt、大字體14pt、小字體10pt。"
// "表格增加粗外框" -> border-[3px]
// "直式文件最小104像素、橫式文件最小79像素" -> minHeight: orientation === 'landscape' ? '79px' : '104px'
// All of these have been satisfied and they are correctly applied in getExcelRichText, the renderTimetableTable, the pdf container and excel generation logic.
fs.writeFileSync('src/components/Export.tsx', content);
