/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from './store';
import Students from './components/Students';
import Courses from './components/Courses';
import EnrollmentView from './components/Enrollment';
import CourseAssignment from './components/CourseAssignment';
import ExportView from './components/Export';
import DataManagerView from './components/DataManagerView';
import { Calendar, BookCheck as CheckClass, BookCopy, UsersRound , Sheet, Settings, UserCheck } from 'lucide-react';

import DataActions from './components/DataActions';

export default function App() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'data' | 'students' | 'courses' | 'enrollment' | 'assignment' | 'export'>('data');

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans text-[#2D2D2A] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#E8E4D9] border-r border-[#D9D4C7] flex flex-col z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-[#4A4A3A]">特教課表系統  </h1>
            <div className="p-3 w-10 h-10 rounded-lg flex items-center justify-center">
              <button 
                onClick={() => setActiveTab('data')}
                className={`rounded-md transition-colors font-medium ${activeTab === 'data' ? 'text-[#5A5A40]' : 'text-[#BAB5A8]'}`}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
          
          <nav className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mb-2 ml-2">基礎管理</div>
            <button 
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'students' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <UsersRound  size={18} /> <span className="text-sm">學生管理</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'courses' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <BookCopy size={18} /> <span className="text-sm">課程管理</span>
            </button>
            
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mt-6 mb-2 ml-2">學生排課</div>
            <button 
              onClick={() => setActiveTab('assignment')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'assignment' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <UserCheck size={18} /> <span className="text-sm">配課作業</span>
            </button>
            <button 
              onClick={() => setActiveTab('enrollment')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'enrollment' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <CheckClass size={18} /> <span className="text-sm">選課作業</span>
            </button>
            
            <div className="text-[10px] uppercase tracking-widest text-[#8A8475] font-bold mt-6 mb-2 ml-2">課表</div>
            <button 
              onClick={() => setActiveTab('export')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${activeTab === 'export' ? 'bg-[#DED9CC] text-[#5A5A40]' : 'text-[#5A5A40]/80 hover:bg-[#DED9CC]'}`}
            >
              <Sheet size={18} /> <span className="text-sm">課表下載</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto gap-3 p-4 flex items-center border-t border-[#D9D4C7] space-y-3">
          <div className="bg-[#F2EFE9] p-3 rounded-lg w-full flex items-center gap-3">
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
              {activeTab === 'data' && '資料管理'}
              {activeTab === 'students' && '學生管理'}
              {activeTab === 'courses' && '課程管理'}
              {activeTab === 'assignment' && '配課作業'}
              {activeTab === 'enrollment' && '選課作業'}              
              {activeTab === 'export' && '課表下載'}
            </h2>
          </div>
          <div className="flex items-center gap-2" id="header-actions">
            {activeTab === 'data' && <DataActions store={store} />}
          </div>
        </header>
        <div className="flex-1 min-h-0 p-8 overflow-hidden flex flex-col">
          {activeTab === 'data' && (
            <DataManagerView store={store} />
          )}
          {activeTab === 'students' && (
            <Students 
              students={store.students} setStudents={store.setStudents}
              categories={store.categories}
            />
          )}
          {activeTab === 'courses' && (
            <Courses 
              courses={store.courses} setCourses={store.setCourses}
              timeSlots={store.timeSlots} teachers={store.teachers} classrooms={store.classrooms}
              categories={store.categories}
            />
          )}
          {activeTab === 'enrollment' && (
            <EnrollmentView 
              students={store.students} courses={store.courses} 
              enrollments={store.enrollments} setEnrollments={store.setEnrollments}
              timeSlots={store.timeSlots}
            />
          )}
          {activeTab === 'assignment' && (
            <CourseAssignment 
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
    </div>
  );
}
