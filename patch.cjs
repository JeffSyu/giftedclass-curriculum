const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Add attendance to exportType
content = content.replace(
  "const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade'>('student');",
  "const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade' | 'attendance'>('student');"
);

// 2. Add attendance button to UI
content = content.replace(
  "<button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'grade' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setExportType('grade')}>年級總表</button>",
  `<button className={\`pb-3 font-medium text-sm focus:outline-none transition-colors \${exportType === 'grade' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}\`} onClick={() => {setExportType('grade'); setSelectedIds([]);}}>年級總表</button>\n          <button className={\`pb-3 font-medium text-sm focus:outline-none transition-colors \${exportType === 'attendance' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}\`} onClick={() => {setExportType('attendance'); setSelectedIds([]);}}>週點名單</button>`
);

// 3. update listData
content = content.replace(
  "else if (exportType === 'classroom') listData = classrooms;",
  "else if (exportType === 'classroom') listData = classrooms;\n  else if (exportType === 'attendance') listData = courses;"
);

// 4. generateAttendanceGridData
const generateAttendanceGridDataFn = `
  const generateAttendanceGridData = (course: Course) => {
    const daysMap = { '1': '星期一', '2': '星期二', '3': '星期三', '4': '星期四', '5': '星期五' };
    
    const courseTimeSlots = (course.timeSlotIds || []).map(slotKey => {
      const [d, tsId] = slotKey.split('_');
      const ts = timeSlots.find(t => t.id === tsId);
      return {
        slotKey,
        day: d,
        tsId,
        tsName: ts ? ts.name : '',
        dayName: (daysMap as any)[d] || '',
        startTime: ts ? ts.startTime : ''
      };
    });
    
    courseTimeSlots.sort((a, b) => {
      if (a.day !== b.day) return Number(a.day) - Number(b.day);
      return a.startTime.localeCompare(b.startTime);
    });

    const headers = ['節次', ...courseTimeSlots.map(ts => \`\${ts.dayName} \${ts.tsName}\`)];
    if (headers.length === 1) headers.push('無排定時段');
    
    const enrolledStudentIds = enrollments
      .filter(e => e.courseIds.includes(course.id))
      .map(e => e.studentId);
    
    const enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
    
    enrolledStudents.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      const classA = a.className || '';
      const classB = b.className || '';
      if (classA !== classB) return classA.localeCompare(classB);
      return a.name.localeCompare(b.name);
    });

    const rows: string[][] = enrolledStudents.map(s => {
      const row = [s.name];
      for (let i = 1; i < headers.length; i++) {
        row.push('');
      }
      return row;
    });
    
    return {
      titleRow: (showTitle && titleText) ? titleText : undefined,
      headers,
      rows,
      footer: showEntityName ? \`顯示名稱區域：\${course.name}\` : undefined
    };
  };
`;

content = content.replace(
  "const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string) => {",
  generateAttendanceGridDataFn + "\n  const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string) => {"
);

// 5. add to getAllExportGridData
content = content.replace(
  "return result;\n  };",
  `} else if (exportType === 'attendance') {
      const targetCourses = courses.filter(c => selectedIds.includes(c.id));
      targetCourses.forEach(course => {
        const gridData = generateAttendanceGridData(course);
        result.push({
          title: \`\${course.name} - 週點名單\`,
          filename: \`\${course.name}_週點名單\`,
          gridData
        });
      });
    }
    return result;
  };`
);

// 6. fix col width and merge
content = content.replace(
  "worksheet.mergeCells(`A${currentRow}:G${currentRow}`);",
  `const getColLetter = (colNum: number) => {
        let temp, letter = '';
        while (colNum > 0) {
          temp = (colNum - 1) % 26;
          letter = String.fromCharCode(temp + 65) + letter;
          colNum = (colNum - temp - 1) / 26;
        }
        return letter;
      };
      worksheet.mergeCells(\`A\${currentRow}:\${getColLetter(gridData.headers.length)}\${currentRow}\`);`
);

content = content.replace(
  "worksheet.getColumn(1).width = 12;\n    worksheet.getColumn(2).width = 16;\n    for (let i = 3; i <= 7; i++) {\n      worksheet.getColumn(i).width = 22;\n    }",
  `if (exportType === 'attendance') {
      worksheet.getColumn(1).width = 16;
      for (let i = 2; i <= gridData.headers.length; i++) {
        worksheet.getColumn(i).width = 16;
      }
    } else {
      worksheet.getColumn(1).width = 12;
      worksheet.getColumn(2).width = 16;
      for (let i = 3; i <= gridData.headers.length; i++) {
        worksheet.getColumn(i).width = 22;
      }
    }`
);

fs.writeFileSync('src/components/Export.tsx', content);
