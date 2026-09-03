const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

// 1. Update getAllExportGridData
const oldExportGridData = `    if (exportType === 'student') {
      const targetStudents = students.filter(s => selectedIds.includes(s.id));
      targetStudents.forEach(student => {
        const studentCourses = courses.filter(c => {
          const enrollment = enrollments.find(e => e.studentId === student.id);
          return (enrollment?.courseIds || []).includes(c.id);
        });
        const gridData = generateGridData(studentCourses, student.name, '學生');
        result.push({
          title: student.name || student.id,
          filename: student.name || student.id,
          gridData
        });
      });
    }`;

const newExportGridData = `    if (exportType === 'student') {
      const targetStudents = students.filter(s => selectedIds.includes(s.id));
      targetStudents.forEach(student => {
        const studentCourses = courses.filter(c => {
          const enrollment = enrollments.find(e => e.studentId === student.id);
          return (enrollment?.courseIds || []).includes(c.id);
        });
        
        let prefix = '';
        if (student.grade && student.className) {
          prefix = \`\${student.grade}年級\${student.className}班\`;
        } else if (student.grade) {
          prefix = \`\${student.grade}年級\`;
        }
        const displayName = prefix ? \`\${prefix} \${student.name}\` : student.name;
        
        const gridData = generateGridData(studentCourses, displayName, '學生', student.className, student.grade);
        result.push({
          title: displayName || student.id,
          filename: displayName || student.id,
          gridData
        });
      });
    }`;

content = content.replace(oldExportGridData, newExportGridData);

// 2. Update listData for student
const oldListData = `  if (exportType === 'student') {
    let filtered = students;
    if (filterStudentGrade !== '') {
      filtered = filtered.filter(s => s.grade === filterStudentGrade);
    }
    if (filterStudentCategory !== '') {
      filtered = filtered.filter(s => (s.categoryIds || []).includes(filterStudentCategory));
    }
    listData = filtered;
  }`;

const newListData = `  if (exportType === 'student') {
    let filtered = students;
    if (filterStudentGrade !== '') {
      filtered = filtered.filter(s => s.grade === filterStudentGrade);
    }
    if (filterStudentCategory !== '') {
      filtered = filtered.filter(s => (s.categoryIds || []).includes(filterStudentCategory));
    }
    listData = filtered.map(s => {
      let prefix = '';
      if (s.grade && s.className) {
        prefix = \`\${s.grade}年級\${s.className}班\`;
      } else if (s.grade) {
        prefix = \`\${s.grade}年級\`;
      }
      return {
        ...s,
        name: prefix ? \`\${prefix} \${s.name}\` : s.name
      };
    });
  }`;

content = content.replace(oldListData, newListData);

fs.writeFileSync('src/components/Export.tsx', content);
