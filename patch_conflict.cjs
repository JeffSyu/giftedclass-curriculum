const fs = require('fs');
let content = fs.readFileSync('src/components/Courses.tsx', 'utf8');

const getCourseConflictsFn = `
  const getCourseConflicts = (course: Course) => {
    const conflicts: string[] = [];
    const daysMap = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五' };
    
    course.timeSlotIds.forEach(slot => {
      courses.forEach(otherCourse => {
        if (otherCourse.id === course.id) return;
        if (otherCourse.timeSlotIds.includes(slot)) {
          const [d, tsId] = slot.split('_');
          const ts = timeSlots.find(t => t.id === tsId);
          const timeLabel = \`星期\${(daysMap as any)[d]} \${ts?.name || ''}\`;

          // Check teacher conflict
          const sharedTeachers = course.teacherIds.filter(t => otherCourse.teacherIds.includes(t));
          if (sharedTeachers.length > 0) {
            const tNames = sharedTeachers.map(id => teachers.find(t => t.id === id)?.name).join('、');
            conflicts.push(\`[\${timeLabel}] 與「\${otherCourse.name}」發生教師衝突 (\${tNames})\`);
          }
          // Check classroom conflict
          if (course.classroomId && course.classroomId === otherCourse.classroomId) {
            const rName = classrooms.find(c => c.id === course.classroomId)?.name;
            conflicts.push(\`[\${timeLabel}] 與「\${otherCourse.name}」發生教室衝突 (\${rName})\`);
          }
        }
      });
    });
    return Array.from(new Set(conflicts));
  };
`;

content = content.replace(
  "const actionButtons = (",
  getCourseConflictsFn + "\n  const actionButtons = ("
);

const tbodyOriginal = `            {courses.map(course => (
              <tr key={course.id} className={\`hover:bg-[#FDFBF7] transition-colors group \${selectedIds.has(course.id) ? 'bg-[#FDFBF7]' : 'bg-white'}\`}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(course.id)} onChange={() => toggleSelect(course.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                </td>
                <td className="px-6 py-3 font-mono text-[#8A8475]">{course.id}</td>
                <td className="px-6 py-3 font-medium text-[#2D2D2A]">{course.name}</td>`;

const tbodyReplaced = `            {courses.map(course => {
              const conflicts = getCourseConflicts(course);
              const hasConflict = conflicts.length > 0;
              return (
              <tr key={course.id} className={\`hover:bg-[#FDFBF7] transition-colors group \${selectedIds.has(course.id) ? 'bg-[#FDFBF7]' : 'bg-white'}\`}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(course.id)} onChange={() => toggleSelect(course.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                </td>
                <td className="px-6 py-3 font-mono text-[#8A8475]">{course.id}</td>
                <td className="px-6 py-3 font-medium">
                  {hasConflict ? (
                    <div className="flex items-center gap-1.5 text-[#E06C6C]" title={conflicts.join('\\n')}>
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="truncate">{course.name}</span>
                    </div>
                  ) : (
                    <span className="text-[#2D2D2A]">{course.name}</span>
                  )}
                </td>`;

content = content.replace(tbodyOriginal, tbodyReplaced);

// Since we changed `course => (` to `course => { ... return (` we need to close it with `})}` instead of `))} `
content = content.replace(
  `                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (`,
  `                  </div>
                </td>
              </tr>
              );
            })}
            {courses.length === 0 && (`
);

fs.writeFileSync('src/components/Courses.tsx', content);
