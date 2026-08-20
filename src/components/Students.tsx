import React, { useState } from 'react';
import { Student, Grade, Category } from '../types';
import { GenericManager } from './GenericManager';
import { ConfirmModal } from './Dialogs';

interface StudentsProps {
  students: Student[];
  setStudents: (v: Student[]) => void;
  categories: Category[];
}

export default function Students({ students, setStudents, categories }: StudentsProps) {
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden relative min-h-0">
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <GenericManager 
          data={students} 
          setData={setStudents} 
          setConfirmDialog={setConfirmDialog}
          title="" 
          dataType="students"
          simplifiedLayout={true}
          processUpload={(parsed) => parsed.map(s => ({
            ...s,
            grade: Number(s.grade) as Grade,
            categoryIds: s.categoryIds ? s.categoryIds.split(';').filter(Boolean) : []
          }))}
          prepareDownload={(data) => data.map(s => ({
            ...s,
            categoryIds: s.categoryIds ? s.categoryIds.join(';') : ''
          }))}
          emptyItem={() => ({ id: `S${Date.now()}`, name: '', grade: 7 } as Student)}
          customColumns={['年級', '學生類別']}
          renderCustomFields={(item, updateItem) => (
            <>
              <td className="px-6 py-3">
                <select 
                  value={item.grade} 
                  onChange={e => updateItem(item.id, 'grade', Number(e.target.value) as Grade)}
                  className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1 text-[#2D2D2A]"
                >
                  <option value={7}>七年級</option>
                  <option value={8}>八年級</option>
                  <option value={9}>九年級</option>
                </select>
              </td>
              <td className="px-6 py-3">
                <div className="flex flex-wrap gap-1">
                  {categories.map(c => {
                    const isSelected = item.categoryIds?.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const newIds = isSelected
                            ? (item.categoryIds || []).filter(id => id !== c.id)
                            : [...(item.categoryIds || []), c.id];
                          updateItem(item.id, 'categoryIds', newIds);
                        }}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${isSelected ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'bg-white border-[#D9D4C7] text-[#8A8475] hover:bg-[#F9F8F4]'}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <span className="text-xs text-[#8A8475]">無類別可選</span>}
                </div>
              </td>
            </>
          )}
        />
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
