import React, { useRef, useState } from 'react';
import { TimeSlot, Teacher, Classroom, Student, Grade } from '../types';
import { downloadCSV, parseCSV } from '../utils/csv';
import { Upload, Download, Plus, Trash2, AlertCircle } from 'lucide-react';
import { ConfirmModal } from './Dialogs';

interface SettingsProps {
  timeSlots: TimeSlot[]; setTimeSlots: (v: TimeSlot[]) => void;
  teachers: Teacher[]; setTeachers: (v: Teacher[]) => void;
  classrooms: Classroom[]; setClassrooms: (v: Classroom[]) => void;
  students: Student[]; setStudents: (v: Student[]) => void;
}

export default function Settings({
  timeSlots, setTimeSlots,
  teachers, setTeachers,
  classrooms, setClassrooms,
  students, setStudents
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'timeSlots' | 'teachers' | 'classrooms' | 'students'>('teachers');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden relative">
      <div className="flex bg-[#F9F8F4] border-b border-[#E5E1D5] px-4 pt-4 gap-6 shrink-0">
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'timeSlots' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('timeSlots')}>時段設定</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('teachers')}>師資設定</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'classrooms' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('classrooms')}>教室設定</button>
        <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'students' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('students')}>學生設定</button>
      </div>
      <div className="flex-1 overflow-hidden p-6 bg-white flex flex-col min-h-0">
        {activeTab === 'timeSlots' && <TimeSlotManager data={timeSlots} setData={setTimeSlots} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'teachers' && <TeacherManager data={teachers} setData={setTeachers} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'classrooms' && <ClassroomManager data={classrooms} setData={setClassrooms} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'students' && <StudentManager data={students} setData={setStudents} setConfirmDialog={setConfirmDialog} />}
      </div>
      
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

function GenericManager<T extends { id: string, name: string }>({ data, setData, title, emptyItem, customColumns, renderCustomFields, setConfirmDialog }: { data: T[], setData: (d: T[]) => void, title: string, emptyItem: () => T, customColumns?: string[], renderCustomFields?: (item: T, updateItem: (id: string, field: keyof T, value: any) => void) => React.ReactNode, setConfirmDialog: (dialog: { message: string, onConfirm: () => void } | null) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV<T>(e.target.files[0], (parsed) => {
        setData(parsed);
      });
      e.target.value = ''; // reset
    }
  };

  const addItem = () => {
    setData([...data, emptyItem()]);
  };

  const updateItem = (id: string, field: keyof T, value: any) => {
    setData(data.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      message: `確定要刪除選取的 ${selectedIds.size} 筆資料嗎？`,
      onConfirm: () => {
        setData(data.filter(d => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  const removeSingle = (id: string) => {
    setConfirmDialog({
      message: '確定要刪除這筆資料嗎？',
      onConfirm: () => {
        setData(data.filter(d => d.id !== id));
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
        setConfirmDialog(null);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-semibold text-[#4A4A3A]">{title}</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button onClick={removeSelected} className="flex items-center gap-2 px-4 py-1.5 bg-[#FAF5F5] text-[#A34A4A] border border-[#E8D0D0] rounded-full text-sm font-medium hover:bg-[#F5EAEA] transition-colors mr-2">
              <Trash2 size={14} />  ({selectedIds.size})
            </button>
          )}
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Upload size={14} /> 
          </button>
          <button onClick={() => downloadCSV(data, `${title}.csv`)} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Download size={14} /> 
          </button>
          <button onClick={addItem} className="flex items-center gap-2 px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">
            <Plus size={14} /> 
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto rounded-xl border border-[#E5E1D5]">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5] sticky top-0 z-10 shadow-sm">
            <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
              <th className="px-4 py-4 w-10 text-center">
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              </th>
              <th className="px-6 py-4 font-bold">代碼</th>
              <th className="px-6 py-4 font-bold">名稱</th>
              {customColumns?.map(col => <th key={col} className="px-6 py-4 font-bold">{col}</th>)}
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {data.map(item => (
              <tr key={item.id} className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-[#FDFBF7]' : 'hover:bg-[#FDFBF7]'}`}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                </td>
                <td className="px-6 py-3 font-mono text-[#8A8475]">
                  <input type="text" value={item.id} onChange={e => updateItem(item.id, 'id', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入 ID" />
                </td>
                <td className="px-6 py-3 text-[#2D2D2A]">
                  <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入名稱" />
                </td>
                {renderCustomFields && renderCustomFields(item, updateItem)}
                <td className="px-6 py-3 text-right">
                  <button onClick={() => removeSingle(item.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4 + (customColumns?.length || 0)} className="px-6 py-12 text-center text-[#8A8475] text-sm bg-white">目前沒有資料，請點擊上方按鈕新增</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeacherManager({ data, setData, setConfirmDialog }: { data: Teacher[], setData: (d: Teacher[]) => void, setConfirmDialog: any }) {
  return <GenericManager data={data} setData={setData} setConfirmDialog={setConfirmDialog} title="師資列表" emptyItem={() => ({ id: `T${Date.now()}`, name: '' })} />;
}

function ClassroomManager({ data, setData, setConfirmDialog }: { data: Classroom[], setData: (d: Classroom[]) => void, setConfirmDialog: any }) {
  return <GenericManager data={data} setData={setData} setConfirmDialog={setConfirmDialog} title="教室列表" emptyItem={() => ({ id: `C${Date.now()}`, name: '' })} />;
}

function StudentManager({ data, setData, setConfirmDialog }: { data: Student[], setData: (d: Student[]) => void, setConfirmDialog: any }) {
  return (
    <GenericManager 
      data={data} 
      setData={setData} 
      setConfirmDialog={setConfirmDialog}
      title="學生列表" 
      emptyItem={() => ({ id: `S${Date.now()}`, name: '', grade: 7 })}
      customColumns={['年級']}
      renderCustomFields={(item, updateItem) => (
        <td className="px-6 py-3 text-[#2D2D2A]">
          <select value={item.grade} onChange={e => updateItem(item.id, 'grade', Number(e.target.value))} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1">
            <option value={7}>七年級 (7)</option>
            <option value={8}>八年級 (8)</option>
            <option value={9}>九年級 (9)</option>
          </select>
        </td>
      )}
    />
  );
}

function TimeSlotManager({ data, setData, setConfirmDialog }: { data: TimeSlot[], setData: (d: TimeSlot[]) => void, setConfirmDialog: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV<TimeSlot>(e.target.files[0], (parsed) => {
        setData(parsed);
      });
      e.target.value = '';
    }
  };

  const addItem = () => {
    setData([...data, { id: `TS${Date.now()}`, name: '', startTime: '08:00', endTime: '09:00' }]);
  };

  const updateItem = (id: string, field: keyof TimeSlot, value: any) => {
    setData(data.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      message: `確定要刪除選取的 ${selectedIds.size} 筆資料嗎？`,
      onConfirm: () => {
        setData(data.filter(d => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  const removeSingle = (id: string) => {
    setConfirmDialog({
      message: '確定要刪除這筆資料嗎？',
      onConfirm: () => {
        setData(data.filter(d => d.id !== id));
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
        setConfirmDialog(null);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Check overlaps
  const getOverlaps = () => {
    const overlaps = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const a = data[i];
        const b = data[j];
        if (a.startTime && a.endTime && b.startTime && b.endTime) {
          if (a.startTime < b.endTime && a.endTime > b.startTime) {
            overlaps.add(a.id);
            overlaps.add(b.id);
          }
        }
      }
    }
    return overlaps;
  };

  const overlaps = getOverlaps();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-semibold text-[#4A4A3A]">時段節次設定</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button onClick={removeSelected} className="flex items-center gap-2 px-4 py-1.5 bg-[#FAF5F5] text-[#A34A4A] border border-[#E8D0D0] rounded-full text-sm font-medium hover:bg-[#F5EAEA] transition-colors mr-2">
              <Trash2 size={14} /> ({selectedIds.size})
            </button>
          )}
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Upload size={14} /> 
          </button>
          <button onClick={() => downloadCSV(data, '時段.csv')} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors">
            <Download size={14} /> 
          </button>
          <button onClick={addItem} className="flex items-center gap-2 px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">
            <Plus size={14} /> 
          </button>
        </div>
      </div>
      
      {overlaps.size > 0 && (
        <div className="mb-4 bg-[#FAF5F5] border border-[#E8D0D0] rounded-lg p-3 flex gap-2 items-center text-[#A34A4A] text-sm shrink-0">
          <AlertCircle size={16} className="shrink-0" />
          有 {overlaps.size} 個時段設定發生時間重疊，請檢查起訖時間！
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-[#E5E1D5]">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5] sticky top-0 z-10 shadow-sm">
            <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
              <th className="px-4 py-4 w-10 text-center">
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              </th>
              <th className="px-6 py-4 font-bold">代碼</th>
              <th className="px-6 py-4 font-bold">節次名稱</th>
              <th className="px-6 py-4 font-bold">起訖時間</th>
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {data.map(item => {
              const isOverlap = overlaps.has(item.id);
              return (
                <tr key={item.id} className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-[#FDFBF7]' : 'hover:bg-[#FDFBF7]'} ${isOverlap ? 'bg-[#FAF5F5]/50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                  </td>
                  <td className="px-6 py-3 font-mono text-[#8A8475]">
                    <input type="text" value={item.id} onChange={e => updateItem(item.id, 'id', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="ID" />
                  </td>
                  <td className="px-6 py-3 text-[#2D2D2A]">
                    <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className={`w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1 ${isOverlap ? 'text-[#A34A4A] font-medium' : ''}`} placeholder="名稱 (例如: 第一節)" />
                  </td>
                  <td className="px-6 py-3 text-[#2D2D2A]">
                    <div className="flex items-center gap-2">
                      <input type="time" value={item.startTime || ''} onChange={e => updateItem(item.id, 'startTime', e.target.value)} className="bg-transparent border border-[#D9D4C7] rounded px-2 py-1 text-sm focus:border-[#5A5A40] focus:outline-none" />
                      <span className="text-[#8A8475]">~</span>
                      <input type="time" value={item.endTime || ''} onChange={e => updateItem(item.id, 'endTime', e.target.value)} className="bg-transparent border border-[#D9D4C7] rounded px-2 py-1 text-sm focus:border-[#5A5A40] focus:outline-none" />
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => removeSingle(item.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#8A8475] text-sm bg-white">目前沒有資料，請點擊上方按鈕新增</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
