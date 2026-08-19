/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from './store';
import Settings from './components/Settings';
import Courses from './components/Courses';
import EnrollmentView from './components/Enrollment';
import ExportView from './components/Export';
import DataManager from './components/DataManager';
import { Calendar, Settings as SettingsIcon, BookOpen, Users, Download, Database } from 'lucide-react';

export default function App() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'courses' | 'enrollment' | 'export'>('settings');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans text-[#2D2D2A] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#E8E4D9] border-r border-[#D9D4C7] flex flex-col z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-[#4A4A3A]">特教課表系統</h1>
          </div>
          
          <nav className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mb-2 ml-2">基礎管理</div>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'settings' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <SettingsIcon size={18} /> <span className="text-sm">選項設定檔</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'courses' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <BookOpen size={18} /> <span className="text-sm">課程與開課</span>
            </button>
            
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mt-6 mb-2 ml-2">選課與排課</div>
            <button 
              onClick={() => setActiveTab('enrollment')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'enrollment' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <Users size={18} /> <span className="text-sm">學生選課設定</span>
            </button>
            
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mt-6 mb-2 ml-2">報表匯出</div>
            <button 
              onClick={() => setActiveTab('export')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'export' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <Download size={18} /> <span className="text-sm">課表批次匯出</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-[#D9D4C7]">
          <button 
            onClick={() => setIsDataModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 mb-2 rounded-md transition-colors text-[#5A5A40] hover:bg-[#DED9CC] font-medium"
          >
            <div className="flex items-center gap-3">
              <Database size={18} />
              <span className="text-sm">資料管理</span>
            </div>
          </button>
          <div className="bg-[#F2EFE9] p-3 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#BCB6A4] flex items-center justify-center text-white font-medium">特</div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#4A4A3A]">管理員</p>
              <p className="text-[10px] text-[#8A8475]">特教行政人員</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-[#D9D4C7] flex items-center justify-between px-8 bg-white/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-[#4A4A3A]">
              {activeTab === 'settings' && '選項設定檔 (時段/師資/教室/學生)'}
              {activeTab === 'courses' && '開課作業'}
              {activeTab === 'enrollment' && '學生選課設定'}
              {activeTab === 'export' && '報表匯出'}
            </h2>
          </div>
        </header>
        <div className="flex-1 min-h-0 p-8 overflow-hidden flex flex-col">
          {activeTab === 'settings' && (
            <Settings 
              timeSlots={store.timeSlots} setTimeSlots={store.setTimeSlots}
              teachers={store.teachers} setTeachers={store.setTeachers}
              classrooms={store.classrooms} setClassrooms={store.setClassrooms}
              students={store.students} setStudents={store.setStudents}
            />
          )}
          {activeTab === 'courses' && (
            <Courses 
              courses={store.courses} setCourses={store.setCourses}
              timeSlots={store.timeSlots} teachers={store.teachers} classrooms={store.classrooms}
            />
          )}
          {activeTab === 'enrollment' && (
            <EnrollmentView 
              students={store.students} courses={store.courses} 
              enrollments={store.enrollments} setEnrollments={store.setEnrollments}
              timeSlots={store.timeSlots}
            />
          )}
          {activeTab === 'export' && (
            <ExportView 
              students={store.students} teachers={store.teachers} classrooms={store.classrooms}
              courses={store.courses} enrollments={store.enrollments} timeSlots={store.timeSlots}
            />
          )}
        </div>
      </main>

      {isDataModalOpen && <DataManager store={store} onClose={() => setIsDataModalOpen(false)} />}
    </div>
  );
}
