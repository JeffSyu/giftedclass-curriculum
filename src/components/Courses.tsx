import React, { useRef, useState } from 'react';
import { Course, Grade, TimeSlot, Teacher, Classroom } from '../types';
import { Plus, Trash2, Upload, Download, Edit2, X, AlertCircle } from 'lucide-react';
import { downloadCSV, parseCSV } from '../utils/csv';
import { ConfirmModal } from './Dialogs';

interface CoursesProps {
  courses: Course[]; setCourses: (v: Course[]) => void;
  timeSlots: TimeSlot[]; teachers: Teacher[]; classrooms: Classroom[];
}

export default function Courses({ courses, setCourses, timeSlots, teachers, classrooms }: CoursesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const days = [
    { id: 1, name: '星期一' },
    { id: 2, name: '星期二' },
    { id: 3, name: '星期三' },
    { id: 4, name: '星期四' },
    { id: 5, name: '星期五' },
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV<any>(e.target.files[0], (parsed) => {
        const processed = parsed.map(p => ({
          id: p.id,
          name: p.name,
          timeSlotIds: p.timeSlotIds ? p.timeSlotIds.split(';') : [],
          teacherIds: p.teacherIds ? p.teacherIds.split(';') : [],
          classroomId: p.classroomId || '',
          targetGrades: p.targetGrades ? p.targetGrades.split(';').map(Number) : []
        }));
        setCourses(processed);
      });
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    const data = courses.map(c => ({
      id: c.id,
      name: c.name,
      timeSlotIds: c.timeSlotIds.join(';'),
      teacherIds: c.teacherIds.join(';'),
      classroomId: c.classroomId,
      targetGrades: c.targetGrades.join(';')
    }));
    downloadCSV(data, '課程.csv');
  };

  const openNewCourse = () => {
    setEditingCourse({ id: `C${Date.now()}`, name: '', timeSlotIds: [], teacherIds: [], classroomId: '', targetGrades: [] });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse({ ...course });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const saveCourse = () => {
    if (!editingCourse) return;
    
    // Validation
    if (!editingCourse.id.trim()) { setSaveError('請填寫課程代碼'); return; }
    if (!editingCourse.name.trim()) { setSaveError('請填寫課程名稱'); return; }
    if (editingCourse.targetGrades.length === 0) { setSaveError('請至少選擇一個開放年級'); return; }
    if (!editingCourse.classroomId) { setSaveError('請選擇上課教室'); return; }
    if (editingCourse.teacherIds.length === 0) { setSaveError('請至少選擇一位任課教師'); return; }
    if (editingCourse.timeSlotIds.length === 0) { setSaveError('請於右側表格勾選上課時段'); return; }

    if (courses.some(c => c.id === editingCourse.id)) {
      setCourses(courses.map(c => c.id === editingCourse.id ? editingCourse : c));
    } else {
      setCourses([...courses, editingCourse]);
    }
    setIsModalOpen(false);
  };

  const removeCourse = (id: string) => {
    setConfirmDialog({
      message: '確定要刪除這筆課程嗎？',
      onConfirm: () => {
        setCourses(courses.filter(c => c.id !== id));
        setConfirmDialog(null);
      }
    });
  };

  const toggleArrayItem = (field: 'teacherIds' | 'targetGrades', itemValue: any) => {
    if (!editingCourse) return;
    const arr = editingCourse[field] as any[];
    if (arr.includes(itemValue)) {
      setEditingCourse({ ...editingCourse, [field]: arr.filter(v => v !== itemValue) });
    } else {
      setEditingCourse({ ...editingCourse, [field]: [...arr, itemValue] });
    }
  };

  const toggleTimeSlot = (slotKey: string) => {
    if (!editingCourse) return;
    const arr = editingCourse.timeSlotIds;
    if (arr.includes(slotKey)) {
      setEditingCourse({ ...editingCourse, timeSlotIds: arr.filter(v => v !== slotKey) });
    } else {
      setEditingCourse({ ...editingCourse, timeSlotIds: [...arr, slotKey] });
    }
  };

  // Label helper to show required asterisk
  const renderLabel = (label: string, isEmpty: boolean) => (
    <label className="block text-xs font-bold text-[#8A8475] uppercase tracking-wider mb-1.5 flex items-center gap-1">
      {isEmpty && <span className="text-[#E06C6C]">*</span>}
      {label}
    </label>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium text-[#4A4A3A]">開課設定</h2>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Upload size={14} />
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Download size={14} />
          </button>
          <button onClick={openNewCourse} className="flex items-center gap-2 px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-[#E5E1D5]">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5] sticky top-0 z-10 shadow-sm">
            <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">課程代碼</th>
              <th className="px-6 py-4 font-bold">課程名稱</th>
              <th className="px-6 py-4 font-bold">開放年級</th>
              <th className="px-6 py-4 font-bold">教室</th>
              <th className="px-6 py-4 font-bold">任課教師</th>
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {courses.map(course => (
              <tr key={course.id} className="hover:bg-[#FDFBF7] transition-colors group">
                <td className="px-6 py-3 font-mono text-[#8A8475]">{course.id}</td>
                <td className="px-6 py-3 font-medium text-[#2D2D2A]">{course.name}</td>
                <td className="px-6 py-3 text-[#5A5A40]">{course.targetGrades.map(g => `${g}年級`).join(', ')}</td>
                <td className="px-6 py-3 text-[#2D2D2A]">{classrooms.find(c => c.id === course.classroomId)?.name || '-'}</td>
                <td className="px-6 py-3 text-[#2D2D2A]">{course.teacherIds.map(tId => teachers.find(t => t.id === tId)?.name).join(', ') || '-'}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditCourse(course)} className="text-[#8A8475] hover:text-[#5A5A40] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => removeCourse(course.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#8A8475] text-sm bg-white">目前沒有課程，請點擊右上角按鈕新增</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
          <div className="bg-[#FDFBF7] rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-[#D9D4C7]">
            <div className="flex justify-between items-center p-6 border-b border-[#E5E1D5] bg-white">
              <h3 className="text-xl font-medium text-[#4A4A3A]">{editingCourse.name ? `編輯課程：${editingCourse.name}` : '新增課程'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A8475] hover:text-[#2D2D2A] p-2 rounded-full hover:bg-[#F2EFE9] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">
              {/* Left Column: Basic Info */}
              <div className="w-full md:w-1/3 space-y-5">
                {saveError && (
                  <div className="bg-[#FAF5F5] border border-[#E8D0D0] text-[#A34A4A] px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {saveError}
                  </div>
                )}
                <div>
                  {renderLabel('課程代碼', !editingCourse.id.trim())}
                  <input type="text" value={editingCourse.id} onChange={e => setEditingCourse({ ...editingCourse, id: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]" placeholder="課程代碼" />
                </div>
                <div>
                  {renderLabel('課程名稱', !editingCourse.name.trim())}
                  <input type="text" value={editingCourse.name} onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]" placeholder="課程名稱" />
                </div>
                
                <div>
                  {renderLabel('目標年級 (可複選)', editingCourse.targetGrades.length === 0)}
                  <div className="flex flex-wrap gap-2">
                    {[7, 8, 9].map(grade => (
                      <button key={grade} onClick={() => toggleArrayItem('targetGrades', grade)} className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${editingCourse.targetGrades.includes(grade as Grade) ? 'bg-[#5A5A40] border-[#5A5A40] text-white font-medium shadow-sm' : 'bg-white border-[#D9D4C7] text-[#8A8475] hover:bg-[#F9F8F4]'}`}>
                        {grade}年級
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {renderLabel('上課教室 (單選)', !editingCourse.classroomId)}
                  <select value={editingCourse.classroomId} onChange={e => setEditingCourse({ ...editingCourse, classroomId: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]">
                    <option value="">-- 選擇教室 --</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  {renderLabel('任課教師 (可複選)', editingCourse.teacherIds.length === 0)}
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-white border border-[#D9D4C7] rounded-md shadow-inner">
                    {teachers.map(teacher => (
                      <label key={teacher.id} className="flex items-center gap-2 text-sm bg-white px-2.5 py-1.5 rounded-md border border-[#E5E1D5] shadow-sm cursor-pointer hover:bg-[#F9F8F4] transition-colors">
                        <input type="checkbox" checked={editingCourse.teacherIds.includes(teacher.id)} onChange={() => toggleArrayItem('teacherIds', teacher.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                        <span className="text-[#2D2D2A]">{teacher.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Time Grid */}
              <div className="w-full md:w-2/3">
                {renderLabel('上課時段 (請於表格中勾選)', editingCourse.timeSlotIds.length === 0)}
                <div className="border border-[#E5E1D5] rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-center text-sm table-fixed">
                    <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5]">
                      <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
                        <th className="p-3 font-bold border-r border-[#E5E1D5] w-24">節次</th>
                        {days.map(d => <th key={d.id} className="p-3 font-bold border-r border-[#E5E1D5] last:border-0">{d.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE9]">
                      {timeSlots.map(ts => (
                        <tr key={ts.id} className="hover:bg-[#FDFBF7]">
                          <td className="p-2 border-r border-[#E5E1D5] bg-[#F9F8F4]">
                            <div className="font-medium text-[#4A4A3A]">{ts.name}</div>
                            <div className="text-[10px] text-[#8A8475] mt-0.5 font-mono">{ts.startTime} - {ts.endTime}</div>
                          </td>
                          {days.map(d => {
                            const slotKey = `${d.id}_${ts.id}`;
                            const isChecked = editingCourse.timeSlotIds.includes(slotKey);
                            return (
                              <td key={d.id} className={`p-2 border-r border-[#E5E1D5] last:border-0 cursor-pointer transition-colors ${isChecked ? 'bg-[#5A5A40]/10' : 'hover:bg-[#F2EFE9]'}`} onClick={() => toggleTimeSlot(slotKey)}>
                                <div className="flex justify-center items-center w-full h-full min-h-[40px]">
                                  <input type="checkbox" checked={isChecked} readOnly className="pointer-events-none rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7] w-4 h-4" />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E1D5] bg-white flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-[#D9D4C7] text-[#5A5A40] rounded-full font-medium hover:bg-[#F9F8F4] transition-colors">取消</button>
              <button onClick={saveCourse} className="px-6 py-2 bg-[#5A5A40] text-white rounded-full font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">儲存課程</button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal 
          message={confirmDialog.message} 
          onConfirm={confirmDialog.onConfirm} 
          onCancel={() => setConfirmDialog(null)} 
        />
      )}
    </div>
  );
}
