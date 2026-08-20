import React, { useState, useMemo } from 'react';
import { Student, Course, Enrollment, TimeSlot } from '../types';
import { AlertCircle } from 'lucide-react';

interface CourseAssignmentProps {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  timeSlots: TimeSlot[];
}

export default function CourseAssignment({ students, courses, enrollments, setEnrollments, timeSlots }: CourseAssignmentProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const safeStudents = students || [];
  const safeCourses = courses || [];
  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  const safeTimeSlots = timeSlots || [];

  const selectedCourse = safeCourses.find(c => c.id === selectedCourseId);
  
  // Students available for this course (matching grade and categories)
  const availableStudents = useMemo(() => {
    if (!selectedCourse) return [];
    return safeStudents.filter(s => {
      // Check grade (convert to strings for safe comparison in case of corrupted local storage state)
      const safeTargetGrades = (selectedCourse.targetGrades || []).map(String);
      if (!safeTargetGrades.includes(String(s.grade))) return false;
      
      // Check category restrictions if any
      const validTargetCategoryIds = (selectedCourse.targetCategoryIds || []).filter(Boolean);
      if (validTargetCategoryIds.length > 0) {
        const studentCategories = (s.categoryIds || []).filter(Boolean);
        const hasMatchingCategory = validTargetCategoryIds.some(catId => studentCategories.includes(catId));
        if (!hasMatchingCategory) return false;
      }
      
      return true;
    });
  }, [selectedCourse, safeStudents]);

  const toggleStudent = (studentId: string) => {
    if (!selectedCourseId) return;
    
    setEnrollments((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existingRecordIndex = safePrev.findIndex(e => e.studentId === studentId);
      
      if (existingRecordIndex >= 0) {
        const existingRecord = safePrev[existingRecordIndex];
        const currentCourseIds = existingRecord.courseIds || [];
        const hasCourse = currentCourseIds.includes(selectedCourseId);
        const newCourseIds = hasCourse
          ? currentCourseIds.filter(id => id !== selectedCourseId)
          : [...currentCourseIds, selectedCourseId];
        
        const newRecord = { ...existingRecord, courseIds: newCourseIds };
        const newEnrollments = [...safePrev];
        newEnrollments[existingRecordIndex] = newRecord;
        return newEnrollments;
      } else {
        // Create new record for student
        return [...safePrev, { studentId, courseIds: [selectedCourseId] }];
      }
    });
  };

  // Pre-calculate which students have conflicts if they take this course
  // (Conflicts with their OTHER currently enrolled courses)
  const studentConflicts = useMemo(() => {
    if (!selectedCourse) return new Map<string, Course[]>();
    const conflictMap = new Map<string, Course[]>();
    const courseTimeSlots = selectedCourse.timeSlotIds || [];
    
    availableStudents.forEach(student => {
      const currentEnrollment = safeEnrollments.find(e => e.studentId === student.id);
      if (!currentEnrollment) return;
      
      const enrolledCourseIds = currentEnrollment.courseIds || [];
      // Other courses the student is taking
      const otherCourses = safeCourses.filter(c => c.id !== selectedCourse.id && enrolledCourseIds.includes(c.id));
      
      // Check if any of those courses share a time slot with the selected course
      const conflictingOtherCourses = otherCourses.filter(otherC => 
        (otherC.timeSlotIds || []).some(slotId => courseTimeSlots.includes(slotId))
      );
      
      if (conflictingOtherCourses.length > 0) {
        conflictMap.set(student.id, conflictingOtherCourses);
      }
    });
    
    return conflictMap;
  }, [selectedCourse, availableStudents, safeEnrollments, safeCourses]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden p-6">
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left Panel: Course Select */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-[#8A8475] uppercase tracking-wider mb-2">選擇課程</label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full px-4 py-2 bg-[#FDFBF7] border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-[#2D2D2A]">
              <option value="">-- 請選擇課程 --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <div className="flex flex-col gap-3 bg-[#F9F8F4] border border-[#E5E1D5] rounded-xl p-4 mt-2">
              <h3 className="font-bold text-[#4A4A3A] mb-1">課程資訊</h3>
              <div className="text-sm text-[#2D2D2A]">
                <span className="text-[#8A8475] inline-block w-20">課程名稱：</span>
                <span className="font-medium">{selectedCourse.name}</span>
              </div>
              <div className="text-sm text-[#2D2D2A]">
                <span className="text-[#8A8475] inline-block w-20">開課年級：</span>
                <span>{(selectedCourse.targetGrades || []).join(', ')} 年級</span>
              </div>
              <div className="text-sm text-[#2D2D2A] flex items-start gap-0">
                <span className="text-[#8A8475] inline-block w-20 shrink-0">時段：</span>
                <span className="flex-1 break-words">
                  {(selectedCourse.timeSlotIds || []).map(slotId => {
                    const [dStr, pId] = slotId.split('_');
                    const dayNames = ['', '星期一', '星期二', '星期三', '星期四', '星期五'];
                    const ts = safeTimeSlots.find(t => t.id === pId);
                    return `${dayNames[Number(dStr)] || ''} ${ts?.name || ''}`;
                  }).join('、') || '尚未安排'}
                </span>
              </div>
              <div className="text-sm text-[#2D2D2A] pt-3 mt-1 border-t border-[#E5E1D5] flex justify-between items-center font-medium">
                <span>目前選課人數</span>
                <span className="bg-white border border-[#D9D4C7] px-2 py-0.5 rounded-full text-[#5A5A40]">
                  {safeEnrollments.filter(e => (e.courseIds || []).includes(selectedCourse.id)).length} 人
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Eligible Students */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          {selectedCourse ? (
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-[#E5E1D5] rounded-xl overflow-hidden">
              <div className="p-4 bg-[#F9F8F4] border-b border-[#E5E1D5] flex justify-between items-center">
                <h3 className="font-bold text-[#4A4A3A] text-sm">可選學生清單</h3>
                <span className="text-xs font-bold text-[#8A8475] bg-white px-2 py-1 rounded shadow-sm border border-[#E5E1D5] tracking-widest uppercase">
                  符合條件: {availableStudents.length} 人
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {availableStudents.map(student => {
                  const currentEnrollment = enrollments.find(e => e.studentId === student.id);
                  const isEnrolled = currentEnrollment?.courseIds.includes(selectedCourse.id) || false;
                  const conflicts = studentConflicts.get(student.id);
                  
                  return (
                    <label key={student.id} className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isEnrolled ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm' : 'bg-white border-[#E5E1D5] hover:border-[#BCB6A4]'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={isEnrolled} onChange={() => toggleStudent(student.id)} className="mt-1 rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                        <div>
                          <div className={`font-medium ${isEnrolled ? 'text-[#4A4A3A]' : 'text-[#2D2D2A]'}`}>
                            {student.name} <span className="text-xs text-[#8A8475] font-normal ml-2">{student.grade}年級</span>
                          </div>
                          {conflicts && conflicts.length > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-[#A34A4A] mt-1.5 font-medium bg-[#FAF5F5] px-2 py-0.5 rounded border border-[#E8D0D0] inline-flex">
                              <AlertCircle size={10} /> 
                              若選取將與 {conflicts.map(c => c.name).join('、')} 衝堂
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
                {availableStudents.length === 0 && (
                  <div className="text-sm text-[#8A8475] text-center py-8">目前沒有符合此課程限制的學生</div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#8A8475] bg-[#FDFBF7] rounded-xl border border-dashed border-[#D9D4C7]">
              請先於左側選擇課程以顯示符合條件的學生
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
