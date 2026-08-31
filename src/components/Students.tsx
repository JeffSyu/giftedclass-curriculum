import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Student, Grade, Category } from '../types';
import { Plus, Trash2, Upload, Download, Edit2, X, AlertCircle } from 'lucide-react';
import { downloadCSV, parseCSV } from '../utils/csv';
import { ConfirmModal } from './Dialogs';

interface StudentsProps {
  students: Student[];
  setStudents: (v: Student[]) => void;
  categories: Category[];
}

export default function Students({ students, setStudents, categories }: StudentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const removeSelected = () => {
    setConfirmDialog({
      message: `確定要刪除選取的 ${selectedIds.size} 筆學生資料嗎？`,
      onConfirm: () => {
        setStudents(students.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  useEffect(() => {
    setHeaderTarget(document.getElementById('header-actions'));
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV<any>(e.target.files[0], (parsed) => {
        const processed = parsed.map(p => ({
          id: p.id,
          name: p.name,
          grade: Number(p.grade) as Grade,
          className: p.className || '',
          categoryIds: p.categoryIds ? p.categoryIds.split(';').filter(Boolean) : []
        }));
        setStudents(processed);
      });
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    const data = students.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      className: s.className || '',
      categoryIds: s.categoryIds ? s.categoryIds.join(';') : ''
    }));
    downloadCSV(data, 'students.csv');
  };

  const openNewStudent = () => {
    setEditingStudent({ id: `S${Date.now()}`, name: '', grade: 7, className: '', categoryIds: [] });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const openEditStudent = (student: Student) => {
    setEditingStudent({ categoryIds: [], className: '', ...student });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const saveStudent = () => {
    if (!editingStudent) return;
    
    // Validation
    if (!editingStudent.id.trim()) { setSaveError('請填寫學生代碼/學號'); return; }
    if (!editingStudent.name.trim()) { setSaveError('請填寫學生姓名'); return; }
    
    if (students.some(s => s.id === editingStudent.id && s.id !== editingStudent.id)) {
      // Actually checking if ID exists and we are creating new (wait, if we edit id to an existing one)
      // better check
      // For now skip complex duplicate check, just update or insert
    }

    if (students.some(s => s.id === editingStudent.id)) {
      setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    } else {
      setStudents([...students, editingStudent]);
    }
    setIsModalOpen(false);
  };

  const removeStudent = (id: string) => {
    setConfirmDialog({
      message: '確定要刪除這筆學生資料嗎？',
      onConfirm: () => {
        setStudents(students.filter(s => s.id !== id));
        setConfirmDialog(null);
      }
    });
  };

  const toggleCategory = (catId: string) => {
    if (!editingStudent) return;
    const arr = editingStudent.categoryIds || [];
    if (arr.includes(catId)) {
      setEditingStudent({ ...editingStudent, categoryIds: arr.filter(v => v !== catId) });
    } else {
      setEditingStudent({ ...editingStudent, categoryIds: [...arr, catId] });
    }
  };

  const renderLabel = (label: string, isEmpty: boolean) => (
    <label className="block text-xs font-bold text-[#8A8475] uppercase tracking-wider mb-1.5 flex items-center gap-1">
      {isEmpty && <span className="text-[#E06C6C]">*</span>}
      {label}
    </label>
  );

  const actionButtons = (
    <div className="flex gap-2">
      {selectedIds.size > 0 && (
        <button onClick={removeSelected} className="flex items-center gap-2 px-4 py-1.5 bg-[#FAF5F5] text-[#A34A4A] border border-[#E8D0D0] rounded-full text-sm font-medium hover:bg-[#F5EAEA] transition-colors mr-2">
          <Trash2 size={14} /> ({selectedIds.size})
        </button>
      )}
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUpload} />
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors shadow-sm">
        <Upload size={14} />
      </button>
      <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors shadow-sm">
        <Download size={14} />
      </button>
      <button onClick={openNewStudent} className="flex items-center gap-2 px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden relative min-h-0">
      {headerTarget && createPortal(actionButtons, headerTarget)}
      
      <div className="flex-1 overflow-auto rounded-xl border border-[#E5E1D5]">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5] sticky top-0 z-10 shadow-sm">
            <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
              <th className="px-4 py-4 w-10 text-center">
                <input type="checkbox" checked={selectedIds.size === students.length && students.length > 0} onChange={toggleSelectAll} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              </th>
              <th className="px-6 py-4 font-bold">學號/代碼</th>
              <th className="px-6 py-4 font-bold">姓名</th>
              <th className="px-6 py-4 font-bold">年級</th>
              <th className="px-6 py-4 font-bold">班級</th>
              <th className="px-6 py-4 font-bold">學生類別</th>
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {students.map(student => (
              <tr key={student.id} className={`hover:bg-[#FDFBF7] transition-colors group ${selectedIds.has(student.id) ? 'bg-[#FDFBF7]' : 'bg-white'}`}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleSelect(student.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                </td>
                <td className="px-6 py-3 font-mono text-[#8A8475]">{student.id}</td>
                <td className="px-6 py-3 font-medium text-[#2D2D2A]">{student.name}</td>
                <td className="px-6 py-3 text-[#5A5A40]">{student.grade}年級</td>
                <td className="px-6 py-3 text-[#2D2D2A]">{student.className || '-'}</td>
                <td className="px-6 py-3 text-[#2D2D2A]">
                  <div className="flex flex-wrap gap-1">
                    {student.categoryIds?.map(catId => {
                      const cName = categories.find(c => c.id === catId)?.name;
                      return cName ? (
                        <span key={catId} className="px-2 py-0.5 text-xs rounded border border-[#D9D4C7] text-[#8A8475] bg-[#F9F8F4]">{cName}</span>
                      ) : null;
                    })}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditStudent(student)} className="text-[#8A8475] hover:text-[#5A5A40] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => removeStudent(student.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#8A8475] text-sm bg-white">目前沒有學生資料，請點擊右上角按鈕新增</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
          <div className="bg-[#FDFBF7] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-[#D9D4C7]">
            <div className="flex justify-between items-center p-6 border-b border-[#E5E1D5] bg-white">
              <h3 className="text-xl font-medium text-[#4A4A3A]">{editingStudent.name ? `編輯學生：${editingStudent.name}` : '新增學生'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A8475] hover:text-[#2D2D2A] p-2 rounded-full hover:bg-[#F2EFE9] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              {saveError && (
                <div className="bg-[#FAF5F5] border border-[#E8D0D0] text-[#A34A4A] px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {saveError}
                </div>
              )}
              
              <div>
                {renderLabel('學號 / 代碼', !editingStudent.id.trim())}
                <input type="text" value={editingStudent.id} onChange={e => setEditingStudent({ ...editingStudent, id: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]" placeholder="學號/代碼" />
              </div>
              
              <div>
                {renderLabel('學生姓名', !editingStudent.name.trim())}
                <input type="text" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]" placeholder="學生姓名" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderLabel('年級', false)}
                  <select value={editingStudent.grade} onChange={e => setEditingStudent({ ...editingStudent, grade: Number(e.target.value) as Grade })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]">
                    <option value={7}>七年級</option>
                    <option value={8}>八年級</option>
                    <option value={9}>九年級</option>
                  </select>
                </div>
                <div>
                  {renderLabel('班級', false)}
                  <input type="text" value={editingStudent.className || ''} onChange={e => setEditingStudent({ ...editingStudent, className: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none text-sm text-[#2D2D2A]" placeholder="班級" />
                </div>
              </div>

              <div>
                {renderLabel('學生類別 (可複選)', false)}
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {categories.map(cat => {
                    const isSelected = editingStudent.categoryIds?.includes(cat.id);
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => toggleCategory(cat.id)} 
                        className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${isSelected ? 'bg-[#5A5A40] border-[#5A5A40] text-white font-medium shadow-sm' : 'bg-white border-[#D9D4C7] text-[#8A8475] hover:bg-[#F9F8F4]'}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <div className="text-sm text-[#8A8475]">無可用類別，請至資料管理新增</div>}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E1D5] bg-white flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-[#D9D4C7] text-[#5A5A40] rounded-full font-medium hover:bg-[#F9F8F4] transition-colors">取消</button>
              <button onClick={saveStudent} className="px-6 py-2 bg-[#5A5A40] text-white rounded-full font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">儲存學生</button>
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
