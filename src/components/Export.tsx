import React, { useState } from 'react';
import { Student, Teacher, Classroom, Course, Enrollment, TimeSlot } from '../types';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { useAppStore } from '../store';

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

  // Settings
  const [showTitle, setShowTitle] = useState(false);
  const [titleText, setTitleText] = useState('課表');
  const [showEntityName, setShowEntityName] = useState(true);
  const [infoOptions, setInfoOptions] = useState({
    courseName: true,
    grade: false,
    category: false,
    teacher: false,
    classroom: false
  });

  // Need categories for formatting
  const store = useAppStore();
  const categories = store.categories;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const selectAll = (ids: string[]) => setSelectedIds(ids);
  const clearSelection = () => setSelectedIds([]);

  const days = [1, 2, 3, 4, 5];
  const dayNames = ['星期一', '星期二', '星期三', '星期四', '星期五'];

  const formatCourseInfo = (c: Course) => {
    const parts = [];
    if (infoOptions.courseName) parts.push(c.name);
    if (infoOptions.grade) parts.push(`${c.targetGrades.join(',')}年級`);
    if (infoOptions.category && c.targetCategoryIds && c.targetCategoryIds.length > 0) {
      const catNames = c.targetCategoryIds.map(cid => categories.find(cat => cat.id === cid)?.name).filter(Boolean);
      if (catNames.length > 0) parts.push(`(${catNames.join(',')})`);
    }
    if (infoOptions.teacher && c.teacherIds.length > 0) {
      const tNames = c.teacherIds.map(tid => teachers.find(t => t.id === tid)?.name).filter(Boolean);
      if (tNames.length > 0) parts.push(`${tNames.join(',')}`);
    }
    if (infoOptions.classroom && c.classroomId) {
      const room = classrooms.find(r => r.id === c.classroomId)?.name;
      if (room) parts.push(`${room}`);
    }
    return parts.join('\n');
  };

  const generateGrid = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string) => {
    // Map slotKey (day_period) -> course formatted strings
    const slotMap = new Map<string, string[]>();
    coursesForEntity.forEach(c => {
      const formatted = formatCourseInfo(c);
      c.timeSlotIds.forEach(sid => {
        const existing = slotMap.get(sid) || [];
        existing.push(formatted);
        slotMap.set(sid, existing);
      });
    });

    const aoa: any[][] = [];
    
    if (showTitle && titleText) {
      aoa.push([titleText]);
      aoa.push([]); // empty row for spacing
    }

    // Header
    aoa.push(['節次名稱', '時間範圍', ...dayNames]);
    
    timeSlots.forEach(ts => {
      const row = [ts.name, `${ts.startTime} - ${ts.endTime}`];
      days.forEach(d => {
        const slotKey = `${d}_${ts.id}`;
        if (slotMap.has(slotKey)) {
          // Join multiple courses in same slot with double newline
          row.push(slotMap.get(slotKey)!.join('\n\n'));
        } else {
          row.push('');
        }
      });
      aoa.push(row);
    });

    if (showEntityName) {
      aoa.push([]); // empty row
      aoa.push([`${entityTypeLabel}：${entityName}`]);
    }

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
      const aoa = generateGrid(studentCourses, student.name, '學生');
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, (student.name || student.id).substring(0, 31));
    });
    
    XLSX.writeFile(wb, '學生課表.xlsx');
  };

  const exportTeacherSchedules = () => {
    const wb = XLSX.utils.book_new();
    const targetTeachers = teachers.filter(t => selectedIds.includes(t.id));
    
    targetTeachers.forEach(teacher => {
      const teacherCourses = courses.filter(c => c.teacherIds.includes(teacher.id));
      const aoa = generateGrid(teacherCourses, teacher.name, '教師');
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
      const aoa = generateGrid(classroomCourses, classroom.name, '教室');
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, (classroom.name || classroom.id).substring(0, 31));
    });
    
    XLSX.writeFile(wb, '教室課表.xlsx');
  };

  const exportGradeMasterSchedule = () => {
    const wb = XLSX.utils.book_new();
    const gradeCourses = courses.filter(c => c.targetGrades.includes(selectedGrade as any));
    const aoa = generateGrid(gradeCourses, `${selectedGrade}年級總表`, '年級');
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
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden relative">
      {/* Left panel: List */}
      <div className="w-1/2 flex flex-col border-r border-[#E5E1D5]">
        <div className="flex bg-[#F9F8F4] border-b border-[#E5E1D5] px-4 pt-4 gap-6">
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'student' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('student'); setSelectedIds([]);}}>學生課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'teacher' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('teacher'); setSelectedIds([]);}}>教師課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'classroom' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('classroom'); setSelectedIds([]);}}>教室使用表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'grade' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setExportType('grade')}>年級總表</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {exportType === 'grade' ? (
             <div className="p-4 bg-[#F9F8F4] rounded-xl border border-[#D9D4C7]">
                <label className="block text-sm font-bold text-[#8A8475] uppercase tracking-wider mb-2">選擇年級</label>
                <select value={selectedGrade} onChange={e => setSelectedGrade(Number(e.target.value))} className="w-full px-4 py-2 bg-white border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-[#2D2D2A]">
                  <option value={7}>七年級</option>
                  <option value={8}>八年級</option>
                  <option value={9}>九年級</option>
                </select>
             </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-[#4A4A3A]">清單 ({listData.length} 筆)</span>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => selectAll(listData.map(d => d.id))} className="text-[#5A5A40] hover:text-[#4A4A3A] font-medium">全選</button>
                  <button onClick={clearSelection} className="text-[#8A8475] hover:text-[#5A5A40] font-medium">清除</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {listData.map(item => (
                  <label key={item.id} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm text-[#4A4A3A] font-medium' : 'hover:bg-[#F9F8F4] border-[#E5E1D5] text-[#2D2D2A]'}`}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                    <span className="text-sm truncate">{item.name || item.id}</span>
                  </label>
                ))}
                {listData.length === 0 && (
                  <div className="col-span-full py-8 text-center text-[#8A8475] text-sm">無資料</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right panel: Settings */}
      <div className="w-1/2 p-6 flex flex-col bg-[#FDFBF7]">
        <h3 className="text-lg font-medium text-[#4A4A3A] mb-6">匯出設定</h3>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面配置</h4>
            
            <label className="flex items-center gap-3 p-3 bg-white border border-[#D9D4C7] rounded-lg">
              <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-medium text-[#2D2D2A]">標題列</span>
                {showTitle && (
                  <input type="text" value={titleText} onChange={e => setTitleText(e.target.value)} placeholder="請輸入標題" className="flex-1 px-3 py-1 text-sm bg-[#F9F8F4] border border-[#D9D4C7] rounded focus:ring-1 focus:ring-[#5A5A40] outline-none" />
                )}
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white border border-[#D9D4C7] rounded-lg cursor-pointer">
              <input type="checkbox" checked={showEntityName} onChange={e => setShowEntityName(e.target.checked)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              <span className="text-sm font-medium text-[#2D2D2A]">顯示名稱 (置於表尾左下方)</span>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">課程資訊</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                courseName: '課程名稱',
                grade: '年級',
                category: '學生類別',
                teacher: '教師',
                classroom: '教室'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white border border-[#D9D4C7] rounded-lg cursor-pointer">
                  <input type="checkbox" checked={(infoOptions as any)[key]} onChange={e => setInfoOptions({...infoOptions, [key]: e.target.checked})} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                  <span className="text-sm font-medium text-[#2D2D2A]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Download Button */}
      <button 
        onClick={handleExport}
        disabled={exportType !== 'grade' && selectedIds.length === 0}
        className={`absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${exportType !== 'grade' && selectedIds.length === 0 ? 'bg-[#E5E1D5] text-[#8A8475] cursor-not-allowed' : 'bg-[#5A5A40] text-white hover:bg-[#4A4A3A]'}`}
        title="下載課表"
      >
        <Download size={24} />
      </button>
    </div>
  );
}

