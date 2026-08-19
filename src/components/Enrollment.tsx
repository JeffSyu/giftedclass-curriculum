import React, { useState, useMemo } from 'react';
import { Student, Course, Enrollment, TimeSlot } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface EnrollmentProps {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  timeSlots: TimeSlot[];
}

export default function EnrollmentView({ students, courses, enrollments, setEnrollments, timeSlots }: EnrollmentProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  // Courses available for this student's grade
  const availableCourses = useMemo(() => {
    if (!selectedStudent) return [];
    return courses.filter(c => c.targetGrades.includes(selectedStudent.grade));
  }, [selectedStudent, courses]);

  // Current student's enrollment record
  const currentEnrollment = useMemo(() => {
    return enrollments.find(e => e.studentId === selectedStudentId) || { studentId: selectedStudentId, courseIds: [] };
  }, [enrollments, selectedStudentId]);

  // Calculate conflicts
  const conflicts = useMemo(() => {
    if (!selectedStudent) return [];
    const selectedCourses = courses.filter(c => currentEnrollment.courseIds.includes(c.id));
    const slotMap = new Map<string, Course[]>(); // timeSlotId -> courses
    
    selectedCourses.forEach(course => {
      course.timeSlotIds.forEach(slotId => {
        const existing = slotMap.get(slotId) || [];
        existing.push(course);
        slotMap.set(slotId, existing);
      });
    });

    const conflictList: { slotId: string, courses: Course[] }[] = [];
    slotMap.forEach((coursesInSlot, slotId) => {
      if (coursesInSlot.length > 1) {
        conflictList.push({ slotId, courses: coursesInSlot });
      }
    });
    return conflictList;
  }, [currentEnrollment.courseIds, courses, selectedStudent]);

  const toggleCourse = (courseId: string) => {
    if (!selectedStudentId) return;
    const newCourseIds = currentEnrollment.courseIds.includes(courseId)
      ? currentEnrollment.courseIds.filter(id => id !== courseId)
      : [...currentEnrollment.courseIds, courseId];
    
    const newEnrollment = { studentId: selectedStudentId, courseIds: newCourseIds };
    
    setEnrollments((prev) => {
      const exists = prev.some(e => e.studentId === selectedStudentId);
      if (exists) {
        return prev.map(e => e.studentId === selectedStudentId ? newEnrollment : e);
      } else {
        return [...prev, newEnrollment];
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-[#4A4A3A]">學生選課設定</h2>
        <p className="text-sm text-[#8A8475] mt-1">為個別學生安排課程，系統將自動偵測衝堂風險並篩選符合年級的課程</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left Panel: Student Select & Course List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-[#8A8475] uppercase tracking-wider mb-2">選擇學生</label>
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-4 py-2 bg-[#FDFBF7] border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-[#2D2D2A]">
              <option value="">-- 請選擇學生 --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.grade}年級)</option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#F9F8F4] rounded-xl border border-[#E5E1D5] p-4">
              <h3 className="font-bold text-[#4A4A3A] mb-3 flex justify-between items-center text-sm">
                <span>可選課程清單</span>
                <span className="text-[10px] font-bold text-[#8A8475] bg-white px-2 py-1 rounded shadow-sm border border-[#E5E1D5] tracking-widest uppercase">僅顯示 {selectedStudent.grade} 年級</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {availableCourses.map(course => {
                  const isSelected = currentEnrollment.courseIds.includes(course.id);
                  return (
                    <label key={course.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-white border-[#5A5A40] shadow-sm' : 'bg-white border-[#E5E1D5] hover:border-[#BCB6A4]'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleCourse(course.id)} className="mt-1 rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                      <div>
                        <div className={`font-medium ${isSelected ? 'text-[#4A4A3A]' : 'text-[#2D2D2A]'}`}>{course.name}</div>
                        <div className="text-xs text-[#8A8475] mt-1 font-mono">時段: {course.timeSlotIds.length} | 教師: {course.teacherIds.length}</div>
                      </div>
                    </label>
                  );
                })}
                {availableCourses.length === 0 && (
                  <div className="text-sm text-[#8A8475] text-center py-4">目前沒有符合該年級的課程</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Schedule & Conflict Alerts */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          {selectedStudent ? (
            <>
              {conflicts.length > 0 ? (
                <div className="bg-[#FAF5F5] border border-[#E8D0D0] rounded-xl p-4 flex gap-3 items-start">
                  <AlertCircle className="text-[#A34A4A] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-[#8C3A3A]">衝堂警告 ({conflicts.length} 處)</h4>
                    <ul className="text-sm text-[#A34A4A] mt-1 list-disc list-inside">
                      {conflicts.map((conflict, i) => {
                        const [dStr, pId] = conflict.slotId.split('_');
                        const dayNames = ['', '星期一', '星期二', '星期三', '星期四', '星期五'];
                        const ts = timeSlots.find(t => t.id === pId);
                        const slotName = `${dayNames[Number(dStr)] || ''} ${ts?.name || ''}`;
                        return (
                          <li key={i}>
                            <span className="font-medium">{slotName}</span>: 
                            {conflict.courses.map(c => c.name).join(' 與 ')}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : currentEnrollment.courseIds.length > 0 ? (
                <div className="bg-[#E8F0E8] border border-[#D0E0D0] rounded-xl p-3 flex gap-2 items-center text-[#4A634A] text-sm font-medium">
                  <CheckCircle2 size={18} /> 目前課表無衝堂
                </div>
              ) : null}

              <div className="flex-1 bg-white border border-[#E5E1D5] rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 bg-[#F9F8F4] border-b border-[#E5E1D5] font-bold text-[#4A4A3A] text-center">
                  {selectedStudent.name} 的個人課表草稿
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <StudentSchedulePreview 
                    courseIds={currentEnrollment.courseIds} 
                    courses={courses} 
                    timeSlots={timeSlots} 
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-[#8A8475] bg-[#FDFBF7] rounded-xl border border-dashed border-[#D9D4C7]">
              請先於左側選擇學生以進行選課與預覽課表
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for schedule preview
function StudentSchedulePreview({ courseIds, courses, timeSlots }: { courseIds: string[], courses: Course[], timeSlots: TimeSlot[] }) {
  const selectedCourses = courses.filter(c => courseIds.includes(c.id));
  
  // Map timeSlotId (day_period) -> courses
  const slotMap = new Map<string, Course[]>();
  selectedCourses.forEach(course => {
    course.timeSlotIds.forEach(slotId => {
      const existing = slotMap.get(slotId) || [];
      existing.push(course);
      slotMap.set(slotId, existing);
    });
  });

  const days = [1, 2, 3, 4, 5];
  const dayNames = ['一', '二', '三', '四', '五'];

  return (
    <table className="w-full text-sm border-collapse table-fixed border-[#E5E1D5]">
      <thead>
        <tr>
          <th className="border border-[#E5E1D5] p-2 bg-[#F9F8F4] text-[#8A8475] w-16 font-bold">節次</th>
          {days.map(d => (
            <th key={d} className="border border-[#E5E1D5] p-2 bg-[#F9F8F4] text-[#8A8475] font-bold">週{dayNames[d-1]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map(ts => (
          <tr key={ts.id}>
            <td className="border border-[#E5E1D5] p-2 bg-[#FDFBF7] text-center">
              <div className="font-bold text-[#8A8475]">{ts.name}</div>
              <div className="text-[10px] text-[#BCB6A4] font-mono leading-tight mt-1">{ts.startTime}-{ts.endTime}</div>
            </td>
            {days.map(day => {
              const slotKey = `${day}_${ts.id}`;
              const coursesInSlot = slotMap.get(slotKey) || [];
              const isConflict = coursesInSlot.length > 1;

              return (
                <td key={day} className={`border border-[#E5E1D5] p-1.5 align-top h-16 overflow-hidden ${isConflict ? 'bg-[#F5EAEA]' : 'bg-white'}`}>
                  <div className="flex flex-col gap-1.5">
                    {coursesInSlot.map(c => (
                      <div key={c.id} className={`text-[11px] p-1.5 rounded font-medium truncate border ${isConflict ? 'bg-[#F2ECE4] border-[#E8D0D0] text-[#8C3A3A]' : 'bg-[#E8E4D9] border-[#D9D4C7] text-[#4A4A3A]'}`} title={c.name}>
                        {c.name}
                      </div>
                    ))}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
