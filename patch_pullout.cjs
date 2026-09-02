const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Add 'pullout' to exportType
content = content.replace(
  "const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade' | 'attendance'>('student');",
  "const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade' | 'attendance' | 'pullout'>('student');"
);

// 2. Add '[學生]' to templateTags
content = content.replace(
  "const templateTags = ['[課程名稱]', '[年級]', '[類別]', '[教師]', '[教室]'];",
  "const templateTags = ['[課程名稱]', '[年級]', '[類別]', '[教師]', '[教室]', '[學生]'];"
);

// 3. Update formatCourseInfo
const newFormatCourseInfo = `
  const formatCourseInfo = (c: Course, targetClass?: string) => {
    let text = courseInfoTemplate;
    text = text.replace(/\\[課程名稱\\]/g, c.name || '');
    text = text.replace(/\\[年級\\]/g, (c.targetGrades || []).join(','));
    
    let catText = '';
    if (c.targetCategoryIds && c.targetCategoryIds.length > 0) {
      catText = c.targetCategoryIds.map(cid => categories.find(cat => cat.id === cid)?.name).filter(Boolean).join(',');
    }
    text = text.replace(/\\[類別\\]/g, catText);
    
    let teacherText = '';
    if (c.teacherIds && c.teacherIds.length > 0) {
      teacherText = c.teacherIds.map(tid => teachers.find(t => t.id === tid)?.name).filter(Boolean).join(',');
    }
    text = text.replace(/\\[教師\\]/g, teacherText);
    
    let roomText = '';
    if (c.classroomId) {
      roomText = classrooms.find(r => r.id === c.classroomId)?.name || '';
    }
    text = text.replace(/\\[教室\\]/g, roomText);
    
    let studentText = '';
    const enrolledStudentIds = enrollments.filter(e => e.courseIds.includes(c.id)).map(e => e.studentId);
    let enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
    if (targetClass) {
      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass);
    }
    studentText = enrolledStudents.map(s => s.name).join('、');
    text = text.replace(/\\[學生\\]/g, studentText);
    
    return text.split('\\n').filter(line => line.trim() !== '').join('\\n');
  };
`;

const oldFormatRegex = /const formatCourseInfo = \(c: Course\) => \{[\s\S]*?return text\.split\('\\n'\)\.filter\(line => line\.trim\(\) !== ''\)\.join\('\\n'\);\n  \};/;
content = content.replace(oldFormatRegex, newFormatCourseInfo.trim());

// 4. Update generateGridData signature and formatCourseInfo call
content = content.replace(
  "const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string) => {",
  "const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string, targetClass?: string) => {"
);
content = content.replace(
  "const formatted = formatCourseInfo(c);",
  "const formatted = formatCourseInfo(c, targetClass);"
);

// 5. Add pullout to getAllExportGridData
const pulloutExportLogic = `
    } else if (exportType === 'pullout') {
      selectedIds.forEach(className => {
        const classStudents = students.filter(s => s.className === className);
        const classStudentIds = classStudents.map(s => s.id);
        const classEnrollments = enrollments.filter(e => classStudentIds.includes(e.studentId));
        const courseIds = new Set<string>();
        classEnrollments.forEach(e => {
          e.courseIds.forEach(cid => courseIds.add(cid));
        });
        const pulloutCourses = courses.filter(c => courseIds.has(c.id));
        const gridData = generateGridData(pulloutCourses, className, '班級', className);
        result.push({
          title: \`\${className} 原班抽課表\`,
          filename: \`\${className}_原班抽課表\`,
          gridData
        });
      });
`;

content = content.replace(
  "    } else if (exportType === 'attendance') {",
  pulloutExportLogic + "    } else if (exportType === 'attendance') {"
);

// 6. Update listData logic
const pulloutListDataLogic = `
  else if (exportType === 'pullout') {
    const classesMap = new Map<string, number>();
    students.forEach(s => {
      if (s.className && !classesMap.has(s.className)) {
        classesMap.set(s.className, s.grade || 0);
      }
    });
    listData = Array.from(classesMap.keys()).sort((a, b) => {
      const gA = classesMap.get(a) || 0;
      const gB = classesMap.get(b) || 0;
      if (gA !== gB) return gA - gB;
      return a.localeCompare(b);
    }).map(c => ({ id: c, name: c }));
  }
`;

content = content.replace(
  "  else if (exportType === 'grade') {",
  pulloutListDataLogic + "  else if (exportType === 'grade') {"
);

// 7. Add pullout button to UI
const pulloutButton = `
          <button className={\`pb-3 font-medium text-sm focus:outline-none transition-colors \${exportType === 'pullout' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}\`} onClick={() => {setExportType('pullout'); setSelectedIds([]);}}>原班抽課表</button>
`;

content = content.replace(
  "onClick={() => {setExportType('attendance'); setSelectedIds([]);}}>週點名單</button>",
  "onClick={() => {setExportType('attendance'); setSelectedIds([]);}}>週點名單</button>" + pulloutButton
);

fs.writeFileSync('src/components/Export.tsx', content);
