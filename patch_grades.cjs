const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(
  "const formatCourseInfo = (c: Course, targetClass?: string) => {",
  "const formatCourseInfo = (c: Course, targetClass?: string, targetGrade?: number) => {"
);

content = content.replace(
  "if (targetClass) {\n      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass);\n    }",
  "if (targetClass && targetGrade !== undefined) {\n      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass && s.grade === targetGrade);\n    } else if (targetClass) {\n      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass);\n    }"
);

content = content.replace(
  "const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string, targetClass?: string) => {",
  "const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string, targetClass?: string, targetGrade?: number) => {"
);

content = content.replace(
  "const formatted = formatCourseInfo(c, targetClass);",
  "const formatted = formatCourseInfo(c, targetClass, targetGrade);"
);

const pulloutLogicOld = `    } else if (exportType === 'pullout') {
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
      });`;

const pulloutLogicNew = `    } else if (exportType === 'pullout') {
      selectedIds.forEach(classId => {
        const [gradeStr, className] = classId.split('_');
        const grade = Number(gradeStr);
        const classStudents = students.filter(s => s.grade === grade && s.className === className);
        const classStudentIds = classStudents.map(s => s.id);
        const classEnrollments = enrollments.filter(e => classStudentIds.includes(e.studentId));
        const courseIds = new Set<string>();
        classEnrollments.forEach(e => {
          e.courseIds.forEach(cid => courseIds.add(cid));
        });
        const pulloutCourses = courses.filter(c => courseIds.has(c.id));
        const gridData = generateGridData(pulloutCourses, \`\${grade}年級\${className}班\`, '班級', className, grade);
        result.push({
          title: \`\${grade}年級\${className}班 原班抽課表\`,
          filename: \`\${grade}年級\${className}班_原班抽課表\`,
          gridData
        });
      });`;

content = content.replace(pulloutLogicOld, pulloutLogicNew);

content = content.replace(
  "let listData: {id: string, name: string}[] = [];",
  "let listData: {id: string, name: string, grade?: number}[] = [];"
);

const pulloutListDataLogicOld = `  else if (exportType === 'pullout') {
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
  }`;

const pulloutListDataLogicNew = `  else if (exportType === 'pullout') {
    const classesSet = new Set<string>();
    students.forEach(s => {
      if (s.className && s.grade) {
        classesSet.add(\`\${s.grade}_\${s.className}\`);
      }
    });
    listData = Array.from(classesSet).map(cStr => {
      const [g, c] = cStr.split('_');
      return { id: cStr, name: \`\${c}班\`, grade: Number(g) };
    }).sort((a, b) => {
      if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
      return a.name.localeCompare(b.name);
    });
  }`;

content = content.replace(pulloutListDataLogicOld, pulloutListDataLogicNew);

const renderListOld = `            <div className="grid grid-cols-2 gap-2">
              {listData.map(item => (
                <label key={item.id} className={\`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border \${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm text-[#4A4A3A] font-medium' : 'hover:bg-[#F9F8F4] border-[#E5E1D5] text-[#2D2D2A]'}\`}>
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                  <span className="text-sm truncate">{item.name || item.id}</span>
                </label>
              ))}
              {listData.length === 0 && (
                <div className="col-span-full py-8 text-center text-[#8A8475] text-sm">無資料</div>
              )}
            </div>`;

const renderListNew = `            {exportType === 'pullout' ? (
              <div className="space-y-4">
                {[7, 8, 9].map(grade => {
                  const gradeItems = listData.filter((item: any) => item.grade === grade);
                  if (gradeItems.length === 0) return null;
                  return (
                    <div key={grade}>
                      <h4 className="text-sm font-bold text-[#8A8475] mb-2">{grade}年級</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {gradeItems.map(item => (
                          <label key={item.id} className={\`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border \${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm text-[#4A4A3A] font-medium' : 'hover:bg-[#F9F8F4] border-[#E5E1D5] text-[#2D2D2A]'}\`}>
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                            <span className="text-sm truncate">{item.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {listData.map(item => (
                  <label key={item.id} className={\`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border \${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm text-[#4A4A3A] font-medium' : 'hover:bg-[#F9F8F4] border-[#E5E1D5] text-[#2D2D2A]'}\`}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                    <span className="text-sm truncate">{item.name || item.id}</span>
                  </label>
                ))}
                {listData.length === 0 && (
                  <div className="col-span-full py-8 text-center text-[#8A8475] text-sm">無資料</div>
                )}
              </div>
            )}`;

content = content.replace(renderListOld, renderListNew);

fs.writeFileSync('src/components/Export.tsx', content);
