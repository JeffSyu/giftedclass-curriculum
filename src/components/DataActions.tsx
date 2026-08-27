import React, { useRef, useState } from 'react';
import { FolderDown, FileUp, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toCSVString, parseCSVString } from '../utils/csv';
import { Grade } from '../types';
import { ConfirmModal, AlertModal } from './Dialogs';

interface DataActionsProps {
  store: any;
}

export default function DataActions({ store }: DataActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ message: string, title?: string } | null>(null);

  const clearCache = () => {
    setConfirmDialog({
      message: '確定要刪除所有暫存資料嗎？\n這將會清空系統內所有的設定與課表，且無法復原。',
      onConfirm: () => {
        localStorage.clear();
        store.setTimeSlots([]);
        store.setTeachers([]);
        store.setClassrooms([]);
        store.setCategories([]);
        store.setStudents([]);
        store.setCourses([]);
        store.setEnrollments([]);
        setConfirmDialog(null);
        setAlertDialog({
          title: '清除成功',
          message: '已成功清除所有暫存資料！'
        });
      }
    });
  };

  const handleExport = async () => {
    try {
      const zip = new JSZip();
      
      zip.file("timeSlots.csv", toCSVString(store.timeSlots));
      zip.file("teachers.csv", toCSVString(store.teachers));
      zip.file("classrooms.csv", toCSVString(store.classrooms));
      zip.file("categories.csv", toCSVString(store.categories));
      const studentsCSV = store.students.map((s: any) => ({
        ...s,
        categoryIds: s.categoryIds ? s.categoryIds.join(';') : ''
      }));
      zip.file("students.csv", toCSVString(studentsCSV));
      
      const coursesCSV = store.courses.map((c: any) => ({
        id: c.id,
        name: c.name,
        timeSlotIds: c.timeSlotIds.join(';'),
        teacherIds: c.teacherIds.join(';'),
        classroomId: c.classroomId,
        targetGrades: c.targetGrades.join(';'),
        targetCategoryIds: c.targetCategoryIds ? c.targetCategoryIds.join(';') : ''
      }));
      zip.file("courses.csv", toCSVString(coursesCSV));
      
      zip.file("enrollments.json", JSON.stringify(store.enrollments, null, 2));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `schedule_data_${new Date().toISOString().split('T')[0]}.zip`);
    } catch (e) {
      console.error(e);
      setAlertDialog({ title: '錯誤', message: '匯出失敗' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setConfirmDialog({
        message: '匯入資料將會覆蓋目前系統中的所有資料，確定要繼續嗎？',
        onConfirm: () => {
          setConfirmDialog(null);
          processImport(file);
        }
      });
      e.target.value = '';
    }
  };

  const processImport = async (file: File) => {
    setLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      
      const readCSV = async (filename: string) => {
        const zf = zip.file(filename);
        if (zf) {
          const text = await zf.async("string");
          return parseCSVString<any>(text);
        }
        return null;
      };

      const timeSlots = await readCSV("timeSlots.csv");
      if (timeSlots) store.setTimeSlots(timeSlots);
      
      const teachers = await readCSV("teachers.csv");
      if (teachers) store.setTeachers(teachers);
      
      const classrooms = await readCSV("classrooms.csv");
      if (classrooms) store.setClassrooms(classrooms);

      const categories = await readCSV("categories.csv");
      if (categories) store.setCategories(categories);
      
      const studentsRaw = await readCSV("students.csv");
      if (studentsRaw) {
        store.setStudents(studentsRaw.map((s: any) => ({ 
          ...s, 
          grade: Number(s.grade) as Grade,
          categoryIds: s.categoryIds ? s.categoryIds.split(';').filter(Boolean) : []
        })));
      }

      const coursesRaw = await readCSV("courses.csv");
      if (coursesRaw) {
        const courses = coursesRaw.map((c: any) => ({
          id: c.id,
          name: c.name,
          timeSlotIds: c.timeSlotIds ? c.timeSlotIds.split(';').filter(Boolean) : [],
          teacherIds: c.teacherIds ? c.teacherIds.split(';').filter(Boolean) : [],
          classroomId: c.classroomId || '',
          targetGrades: c.targetGrades ? c.targetGrades.split(';').filter(Boolean).map(Number) : [],
          targetCategoryIds: c.targetCategoryIds ? c.targetCategoryIds.split(';').filter(Boolean) : []
        }));
        store.setCourses(courses);
      }

      const enrollmentsFile = zip.file("enrollments.json");
      if (enrollmentsFile) {
        const jsonText = await enrollmentsFile.async("string");
        store.setEnrollments(JSON.parse(jsonText));
      }

      setAlertDialog({ 
        title: '匯入成功', 
        message: '資料已成功匯入！'
      });
    } catch (err) {
      console.error(err);
      setAlertDialog({ title: '錯誤', message: '解析 ZIP 檔案失敗，請確認檔案格式正確。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-md text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors shadow-sm"
        >
          <FolderDown size={13} /> 備份
        </button>
        <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleImport} />
        <button 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#5A5A40] text-white rounded-md text-sm font-medium shadow-sm transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4A4A3A]'}`}
        >
          <FileUp size={13} /> {loading ? '處理中' : '匯入備份'}
        </button>
        <button 
          onClick={clearCache}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF5F5] text-[#A34A4A] border border-[#E8D0D0] rounded-md text-sm font-medium shadow-sm hover:bg-[#F5EAEA] transition-colors ml-2"
        >
          <Trash2 size={13} /> 清理暫存
        </button>
      </div>

      {confirmDialog && (
        <ConfirmModal 
          message={confirmDialog.message} 
          onConfirm={confirmDialog.onConfirm} 
          onCancel={() => setConfirmDialog(null)} 
        />
      )}

      {alertDialog && (
        <AlertModal 
          title={alertDialog.title} 
          message={alertDialog.message} 
          onClose={() => setAlertDialog(null)} 
        />
      )}
    </>
  );
}
