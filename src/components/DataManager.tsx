import React, { useRef, useState } from 'react';
import { X, Trash2, Download, Upload, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toCSVString, parseCSVString } from '../utils/csv';
import { Grade } from '../types';
import { ConfirmModal, AlertModal } from './Dialogs';

export default function DataManager({ store, onClose }: { store: any, onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ message: string, title?: string, onClose?: () => void } | null>(null);

  const clearCache = () => {
    setConfirmDialog({
      message: '確定要刪除所有暫存資料嗎？\n這將會清空系統內所有的設定與課表，且無法復原。',
      onConfirm: () => {
        localStorage.clear();
        store.setTimeSlots([]);
        store.setTeachers([]);
        store.setClassrooms([]);
        store.setStudents([]);
        store.setCourses([]);
        store.setEnrollments([]);
        setConfirmDialog(null);
        setAlertDialog({
          title: '清除成功',
          message: '已成功清除所有暫存資料！',
          onClose: () => onClose()
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
      zip.file("students.csv", toCSVString(store.students));
      
      const coursesCSV = store.courses.map((c: any) => ({
        id: c.id,
        name: c.name,
        timeSlotIds: c.timeSlotIds.join(';'),
        teacherIds: c.teacherIds.join(';'),
        classroomId: c.classroomId,
        targetGrades: c.targetGrades.join(';')
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
      
      const studentsRaw = await readCSV("students.csv");
      if (studentsRaw) {
        store.setStudents(studentsRaw.map(s => ({ ...s, grade: Number(s.grade) as Grade })));
      }

      const coursesRaw = await readCSV("courses.csv");
      if (coursesRaw) {
        const courses = coursesRaw.map(c => ({
          id: c.id,
          name: c.name,
          timeSlotIds: c.timeSlotIds ? c.timeSlotIds.split(';') : [],
          teacherIds: c.teacherIds ? c.teacherIds.split(';') : [],
          classroomId: c.classroomId || '',
          targetGrades: c.targetGrades ? c.targetGrades.split(';').map(Number) : []
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
        message: '資料已成功匯入！',
        onClose: () => onClose()
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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
        <div className="bg-[#FDFBF7] rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-[#D9D4C7]">
          <div className="flex justify-between items-center p-6 border-b border-[#E5E1D5] bg-white">
            <h3 className="text-xl font-medium text-[#4A4A3A]">資料管理</h3>
            <button onClick={onClose} className="text-[#8A8475] hover:text-[#2D2D2A] p-2 rounded-full hover:bg-[#F2EFE9] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 flex flex-col gap-4">
            <button 
              onClick={clearCache}
              className="flex items-center justify-center gap-2 w-full p-4 border border-[#E8D0D0] bg-[#FAF5F5] text-[#A34A4A] rounded-xl hover:bg-[#F5EAEA] transition-colors font-medium shadow-sm"
            >
              <Trash2 size={20} />
              清空暫存
            </button>

            <hr className="border-[#E5E1D5] mb-2" />

            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 w-full p-4 border border-[#5A5A40] text-[#5A5A40] rounded-xl hover:bg-[#5A5A40]/5 transition-colors font-medium shadow-sm"
            >
              <Download size={20} />
              匯出資料 (ZIP)
            </button>

            <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleImport} />
            <button 
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 w-full p-4 bg-[#5A5A40] text-white rounded-xl transition-colors font-medium shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4A4A3A]'}`}
            >
              <Upload size={20} />
              {loading ? '匯入中...' : '匯入資料 (ZIP)'}
            </button>
          </div>
        </div>
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
          onClose={() => {
            if (alertDialog.onClose) alertDialog.onClose();
            setAlertDialog(null);
          }} 
        />
      )}
    </>
  );
}
