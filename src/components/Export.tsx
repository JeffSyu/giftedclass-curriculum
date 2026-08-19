import React, { useState } from 'react';
import { Student, Teacher, Classroom, Course, Enrollment, TimeSlot } from '../types';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

interface ExportProps {
  students: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  courses: Course[];
  enrollments: Enrollment[];
  timeSlots: TimeSlot[];
}

export default function ExportView({ students, teachers, classrooms, courses, enrollments, timeSlots }: ExportProps) {
  const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade'>('student');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(7);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const selectAll = (ids: string[]) => setSelectedIds(ids);
  const clearSelection = () => setSelectedIds([]);

  const days = [1, 2, 3, 4, 5];
  const dayNames = ['星期一', '星期二', '星期三', '星期四', '星期五'];

  const generateGrid = (coursesForEntity: Course[]) => {
    // Map slotKey (day_period) -> course names
    const slotMap = new Map<string, string[]>();
    coursesForEntity.forEach(c => {
      c.timeSlotIds.forEach(sid => {
        const existing = slotMap.get(sid) || [];
        existing.push(c.name);
        slotMap.set(sid, existing);
      });
    });

    const aoa: any[][] = [];
    // Header
    aoa.push(['節次名稱', '時間範圍', ...dayNames]);
    
    timeSlots.forEach(ts => {
      const row = [ts.name, `${ts.startTime} - ${ts.endTime}`];
      days.forEach(d => {
        const slotKey = `${d}_${ts.id}`;
        if (slotMap.has(slotKey)) {
          row.push(slotMap.get(slotKey)!.join('\n'));
        } else {
          row.push('');
        }
      });
      aoa.push(row);
    });
    return aoa;
  };

  const exportStudentSchedules = () => {
    const wb = XLSX.utils.book_new();
    const targetStudents = students.filter(s => selectedIds.includes(s.id));
    
    targetStudents.forEach(student => {
      const studentCourses = courses.filter(c => {
        const enrollment = enrollments.find(e => e.studentId === student.id);
        return enrollment?.courseIds.includes(c.id);
      });
      const aoa = generateGrid(studentCourses);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, (student.name || student.id).substring(0, 31)); // sheet names max 31 chars
    });
    
    XLSX.writeFile(wb, '學生課表.xlsx');
  };

  const exportTeacherSchedules = () => {
    const wb = XLSX.utils.book_new();
    const targetTeachers = teachers.filter(t => selectedIds.includes(t.id));
    
    targetTeachers.forEach(teacher => {
      const teacherCourses = courses.filter(c => c.teacherIds.includes(teacher.id));
      const aoa = generateGrid(teacherCourses);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, (teacher.name || teacher.id).substring(0, 31));
    });
    
    XLSX.writeFile(wb, '教師課表.xlsx');
  };

  const exportClassroomSchedules = () => {
    const wb = XLSX.utils.book_new();
    const targetClassrooms = classrooms.filter(c => selectedIds.includes(c.id));
    
    targetClassrooms.forEach(classroom => {
      const classroomCourses = courses.filter(c => c.classroomId === classroom.id);
      const aoa = generateGrid(classroomCourses);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, (classroom.name || classroom.id).substring(0, 31));
    });
    
    XLSX.writeFile(wb, '教室課表.xlsx');
  };

  const exportGradeMasterSchedule = () => {
    const wb = XLSX.utils.book_new();
    const gradeCourses = courses.filter(c => c.targetGrades.includes(selectedGrade as any));
    const aoa = generateGrid(gradeCourses);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, `${selectedGrade}年級總表`);
    XLSX.writeFile(wb, `${selectedGrade}年級總表.xlsx`);
  };

  const handleExport = () => {
    if (exportType === 'student') exportStudentSchedules();
    else if (exportType === 'teacher') exportTeacherSchedules();
    else if (exportType === 'classroom') exportClassroomSchedules();
    else if (exportType === 'grade') exportGradeMasterSchedule();
  };

  let listData: {id: string, name: string}[] = [];
  if (exportType === 'student') listData = students;
  else if (exportType === 'teacher') listData = teachers;
  else if (exportType === 'classroom') listData = classrooms;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden">
      <div className="flex bg-[#F9F8F4] border-b border-[#E5E1D5] px-4 pt-4 gap-6">
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'student' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('student'); setSelectedIds([]);}}>學生課表</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'teacher' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('teacher'); setSelectedIds([]);}}>教師課表</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'classroom' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('classroom'); setSelectedIds([]);}}>教室使用表</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'grade' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setExportType('grade')}>年級總表</button>
      </div>
      
      <div className="flex-1 p-6 bg-white flex flex-col items-center justify-center">
        <div className="bg-[#FDFBF7] p-8 rounded-2xl border border-[#D9D4C7] shadow-sm w-full max-w-2xl">
          <h2 className="text-xl font-medium text-[#4A4A3A] mb-6 text-center">
            匯出 {exportType === 'student' ? '學生' : exportType === 'teacher' ? '教師' : exportType === 'classroom' ? '教室' : '年級'} 課表 (Excel)
          </h2>
          
          {exportType === 'grade' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#8A8475] uppercase tracking-wider mb-2">選擇年級</label>
                <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} className="w-full px-4 py-2 bg-white border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-[#2D2D2A]">
                  <option value={7}>七年級</option>
                  <option value={8}>八年級</option>
                  <option value={9}>九年級</option>
                </select>
              </div>
              <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5A5A40] text-white rounded-full hover:bg-[#4A4A3A] transition-colors font-medium shadow-sm">
                <Download size={18} /> 匯出年級總表
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#8A8475] font-medium">已選擇 {selectedIds.length} 筆</span>
                <div className="flex gap-3">
                  <button onClick={() => selectAll(listData.map(d => d.id))} className="text-[#5A5A40] hover:text-[#4A4A3A] font-bold">全選</button>
                  <button onClick={clearSelection} className="text-[#8A8475] hover:text-[#5A5A40] font-medium">清除</button>
                </div>
              </div>
              
              <div className="bg-white border border-[#E5E1D5] rounded-xl p-3 max-h-60 overflow-y-auto shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {listData.map(item => (
                    <label key={item.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm' : 'hover:bg-[#F9F8F4] border-transparent'}`}>
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                      <span className="text-sm text-[#2D2D2A] truncate">{item.name || item.id}</span>
                    </label>
                  ))}
                  {listData.length === 0 && (
                    <div className="col-span-full py-6 text-center text-[#8A8475] text-sm">無資料可選擇</div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleExport} 
                disabled={selectedIds.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full transition-colors font-medium shadow-sm ${selectedIds.length > 0 ? 'bg-[#5A5A40] text-white hover:bg-[#4A4A3A]' : 'bg-[#E5E1D5] text-[#8A8475] cursor-not-allowed border border-[#D9D4C7]'}`}
              >
                <Download size={18} /> 批次匯出 Excel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
