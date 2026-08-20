import React, { useState } from 'react';
import { TimeSlot, Teacher, Classroom, Category } from '../types';
import { GenericManager } from './GenericManager';
import { ConfirmModal } from './Dialogs';
import { Grade } from '../types';

interface DataManagerViewProps {
  store: any;
}

export default function DataManagerView({ store }: DataManagerViewProps) {
  const [activeTab, setActiveTab] = useState<'timeSlots' | 'teachers' | 'classrooms' | 'categories'>('timeSlots');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden relative">
      <div className="flex bg-[#F9F8F4] border-b border-[#E5E1D5] px-4 pt-4 gap-6 shrink-0 overflow-x-auto">
        <button className={`pb-3 font-medium text-sm whitespace-nowrap focus:outline-none transition-colors ${activeTab === 'timeSlots' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('timeSlots')}>時段設定</button>
        <button className={`pb-3 font-medium text-sm whitespace-nowrap focus:outline-none transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('teachers')}>師資設定</button>
        <button className={`pb-3 font-medium text-sm whitespace-nowrap focus:outline-none transition-colors ${activeTab === 'classrooms' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('classrooms')}>教室設定</button>
        <button className={`pb-3 font-medium text-sm whitespace-nowrap focus:outline-none transition-colors ${activeTab === 'categories' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => setActiveTab('categories')}>學生類別設定</button>
      </div>
      <div className="flex-1 overflow-hidden p-6 bg-white flex flex-col min-h-0">
        {activeTab === 'timeSlots' && <TimeSlotManager data={store.timeSlots} setData={store.setTimeSlots} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'teachers' && <TeacherManager data={store.teachers} setData={store.setTeachers} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'classrooms' && <ClassroomManager data={store.classrooms} setData={store.setClassrooms} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'categories' && <CategoryManager data={store.categories} setData={store.setCategories} setConfirmDialog={setConfirmDialog} />}
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

function TeacherManager({ data, setData, setConfirmDialog }: { data: Teacher[], setData: (d: Teacher[]) => void, setConfirmDialog: any }) {
  return <GenericManager data={data} setData={setData} setConfirmDialog={setConfirmDialog} title="師資列表" dataType="teachers" emptyItem={() => ({ id: `T${Date.now()}`, name: '' })} />;
}

function ClassroomManager({ data, setData, setConfirmDialog }: { data: Classroom[], setData: (d: Classroom[]) => void, setConfirmDialog: any }) {
  return <GenericManager data={data} setData={setData} setConfirmDialog={setConfirmDialog} title="教室列表" dataType="classrooms" emptyItem={() => ({ id: `C${Date.now()}`, name: '' })} />;
}

function CategoryManager({ data, setData, setConfirmDialog }: { data: Category[], setData: (d: Category[]) => void, setConfirmDialog: any }) {
  return <GenericManager data={data} setData={setData} setConfirmDialog={setConfirmDialog} title="學生類別列表" dataType="categories" emptyItem={() => ({ id: `CAT${Date.now()}`, name: '' })} />;
}

function TimeSlotManager({ data, setData, setConfirmDialog }: { data: TimeSlot[], setData: (d: TimeSlot[]) => void, setConfirmDialog: any }) {
  return (
    <GenericManager 
      data={data} 
      setData={setData} 
      setConfirmDialog={setConfirmDialog}
      title="時段列表" 
      dataType="timeSlots"
      emptyItem={() => ({ id: `TS${Date.now()}`, name: '', startTime: '08:00', endTime: '09:00' })}
      customColumns={['時間範圍']}
      renderCustomFields={(item, updateItem) => {
        const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newStart = e.target.value;
          updateItem(item.id, 'startTime', newStart);
          if (newStart > item.endTime) updateItem(item.id, 'endTime', newStart);
        };
        const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newEnd = e.target.value;
          updateItem(item.id, 'endTime', newEnd);
          if (newEnd < item.startTime) updateItem(item.id, 'startTime', newEnd);
        };

        return (
          <td className="px-6 py-3 text-[#2D2D2A]">
            <div className="flex items-center gap-2">
              <input type="time" step="300" value={item.startTime} onChange={handleStartTimeChange} className="bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" />
              <span className="text-[#8A8475]">~</span>
              <input type="time" step="300" value={item.endTime} onChange={handleEndTimeChange} className="bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" />
            </div>
          </td>
        );
      }}
    />
  );
}

