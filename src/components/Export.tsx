import React, { useState, useRef } from 'react';
import { Student, Teacher, Classroom, Course, Enrollment, TimeSlot } from '../types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Download, Eye, X, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportProps {
  students: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  courses: Course[];
  enrollments: Enrollment[];
  timeSlots: TimeSlot[];
}

const THEMES = {
  default: { name: '預設(灰)', headerBg: 'FFF3F4F6', headerText: 'FF1F2937', border: 'FFD1D5DB', cssBg: '#F3F4F6', cssText: '#1F2937', cssBorder: '#D1D5DB' },
  blue: { name: '清新藍', headerBg: 'FFE8F0FE', headerText: 'FF174EA6', border: 'FF8AB4F8', cssBg: '#E8F0FE', cssText: '#174EA6', cssBorder: '#8AB4F8' },
  green: { name: '自然綠', headerBg: 'FFE6F4EA', headerText: 'FF0D652D', border: 'FF81C995', cssBg: '#E6F4EA', cssText: '#0D652D', cssBorder: '#81C995' },
  warm: { name: '溫暖橘', headerBg: 'FFFCE8E6', headerText: 'FFA50E0E', border: 'FFF28B82', cssBg: '#FCE8E6', cssText: '#A50E0E', cssBorder: '#F28B82' },
};
type ThemeKey = keyof typeof THEMES;

export default function ExportView({ students, teachers, classrooms, courses, enrollments, timeSlots }: ExportProps) {
  const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade'>('student');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(7);

  // Settings
  const [showTitle, setShowTitle] = useState(false);
  const [titleText, setTitleText] = useState('課表');
  const [showEntityName, setShowEntityName] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');
  const [infoOptions, setInfoOptions] = useState({
    courseName: true,
    grade: false,
    category: false,
    teacher: false,
    classroom: false
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  const pdfContainerRef = useRef<HTMLDivElement>(null);

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
    if (infoOptions.grade) parts.push(`${(c.targetGrades || []).join(',')}年級`);
    if (infoOptions.category && c.targetCategoryIds && c.targetCategoryIds.length > 0) {
      const catNames = c.targetCategoryIds.map(cid => categories.find(cat => cat.id === cid)?.name).filter(Boolean);
      if (catNames.length > 0) parts.push(`(${catNames.join(',')})`);
    }
    if (infoOptions.teacher && c.teacherIds && c.teacherIds.length > 0) {
      const tNames = c.teacherIds.map(tid => teachers.find(t => t.id === tid)?.name).filter(Boolean);
      if (tNames.length > 0) parts.push(`${tNames.join(',')}`);
    }
    if (infoOptions.classroom && c.classroomId) {
      const room = classrooms.find(r => r.id === c.classroomId)?.name;
      if (room) parts.push(`${room}`);
    }
    return parts.join('\n');
  };

  const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string) => {
    // Map slotKey (day_period) -> course formatted strings
    const slotMap = new Map<string, string[]>();
    coursesForEntity.forEach(c => {
      const formatted = formatCourseInfo(c);
      (c.timeSlotIds || []).forEach(sid => {
        const existing = slotMap.get(sid) || [];
        existing.push(formatted);
        slotMap.set(sid, existing);
      });
    });

    const headers = ['節次', '時間', ...dayNames];
    const rows: string[][] = [];
    
    (timeSlots || []).forEach(ts => {
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
      rows.push(row);
    });

    return {
      titleRow: (showTitle && titleText) ? titleText : undefined,
      headers,
      rows,
      footer: showEntityName ? `${entityTypeLabel}：${entityName}` : undefined
    };
  };

  const getAllExportGridData = () => {
    const result: { title: string; filename: string; gridData: ReturnType<typeof generateGridData> }[] = [];
    
    if (exportType === 'student') {
      const targetStudents = students.filter(s => selectedIds.includes(s.id));
      targetStudents.forEach(student => {
        const studentCourses = courses.filter(c => {
          const enrollment = enrollments.find(e => e.studentId === student.id);
          return (enrollment?.courseIds || []).includes(c.id);
        });
        const gridData = generateGridData(studentCourses, student.name, '學生');
        result.push({
          title: student.name || student.id,
          filename: student.name || student.id,
          gridData
        });
      });
    } else if (exportType === 'teacher') {
      const targetTeachers = teachers.filter(t => selectedIds.includes(t.id));
      targetTeachers.forEach(teacher => {
        const teacherCourses = courses.filter(c => (c.teacherIds || []).includes(teacher.id));
        const gridData = generateGridData(teacherCourses, teacher.name, '教師');
        result.push({
          title: teacher.name || teacher.id,
          filename: teacher.name || teacher.id,
          gridData
        });
      });
    } else if (exportType === 'classroom') {
      const targetClassrooms = classrooms.filter(c => selectedIds.includes(c.id));
      targetClassrooms.forEach(classroom => {
        const classroomCourses = courses.filter(c => c.classroomId === classroom.id);
        const gridData = generateGridData(classroomCourses, classroom.name, '教室');
        result.push({
          title: classroom.name || classroom.id,
          filename: classroom.name || classroom.id,
          gridData
        });
      });
    } else if (exportType === 'grade') {
      const gradeCourses = courses.filter(c => (c.targetGrades || []).includes(selectedGrade as any));
      const gridData = generateGridData(gradeCourses, `${selectedGrade}年級總表`, '年級');
      result.push({
        title: `${selectedGrade}年級總表`,
        filename: `${selectedGrade}年級總表`,
        gridData
      });
    }
    return result;
  };

  const buildWorksheet = (worksheet: ExcelJS.Worksheet, gridData: any) => {
    const themeColor = THEMES[selectedTheme];
    let currentRow = 1;

    if (gridData.titleRow) {
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = gridData.titleRow;
      titleCell.font = { size: 16, bold: true, name: 'Microsoft JhengHei' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getRow(currentRow).height = 30;
      currentRow += 2; // skip a row
    }

    // Headers
    const headerRow = worksheet.getRow(currentRow);
    gridData.headers.forEach((h: string, i: number) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor.headerBg } };
      cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: themeColor.border } },
        left: { style: 'thin', color: { argb: themeColor.border } },
        bottom: { style: 'thin', color: { argb: themeColor.border } },
        right: { style: 'thin', color: { argb: themeColor.border } }
      };
    });
    headerRow.height = 25;
    currentRow++;

    // Rows
    gridData.rows.forEach((rData: string[]) => {
      const row = worksheet.getRow(currentRow);
      let maxLines = 1;
      rData.forEach((val: string, i: number) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.font = { name: 'Microsoft JhengHei' };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: themeColor.border } },
          left: { style: 'thin', color: { argb: themeColor.border } },
          bottom: { style: 'thin', color: { argb: themeColor.border } },
          right: { style: 'thin', color: { argb: themeColor.border } }
        };
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      });
      row.height = maxLines * 16 + 10;
      currentRow++;
    });

    if (gridData.footer) {
      currentRow++; // empty row
      const footerCell = worksheet.getCell(`A${currentRow}`);
      footerCell.value = gridData.footer;
      footerCell.font = { name: 'Microsoft JhengHei', bold: true };
    }

    // Column widths
    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 16;
    for (let i = 3; i <= 7; i++) {
      worksheet.getColumn(i).width = 22;
    }
  };

  const getSafeSheetName = (name: string) => name.replace(/[\\/?*[\]]/g, '').substring(0, 31);

  const handleExportExcel = async () => {
    setIsDownloadMenuOpen(false);
    const workbook = new ExcelJS.Workbook();
    const exportItems = getAllExportGridData();

    if (exportItems.length === 0) return;

    exportItems.forEach(item => {
      const sheetName = getSafeSheetName(item.filename || 'Sheet');
      const ws = workbook.addWorksheet(sheetName);
      buildWorksheet(ws, item.gridData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = exportItems.length === 1 
      ? `${exportItems[0].filename}_課表.xlsx` 
      : `課表匯出_${exportType}_${new Date().getTime()}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  const handleExportPDF = async () => {
    setIsDownloadMenuOpen(false);
    const exportItems = getAllExportGridData();
    if (exportItems.length === 0) return;

    setIsExportingPDF(true);
    setPdfProgress('準備中...');

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const container = pdfContainerRef.current;
      if (!container) throw new Error('PDF render container not found');

      for (let i = 0; i < exportItems.length; i++) {
        setPdfProgress(`正在產生 PDF 頁面 (${i + 1}/${exportItems.length})...`);
        const itemElement = container.children[i] as HTMLElement;
        if (!itemElement) continue;

        // Render element to high-res canvas
        const canvas = await html2canvas(itemElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;
        const maxContentWidth = pageWidth - margin * 2;
        const maxContentHeight = pageHeight - margin * 2;

        const imgWidth = maxContentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let finalWidth = imgWidth;
        let finalHeight = imgHeight;
        if (finalHeight > maxContentHeight) {
          finalHeight = maxContentHeight;
          finalWidth = (canvas.width * finalHeight) / canvas.height;
        }

        const posX = margin + (maxContentWidth - finalWidth) / 2;
        const posY = margin + (maxContentHeight - finalHeight) / 2;

        if (i > 0) {
          pdf.addPage('a4', 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight);
      }

      const fileName = exportItems.length === 1 
        ? `${exportItems[0].filename}_課表.pdf` 
        : `課表匯出_${exportType}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF 匯出失敗，請重試或改用 Excel 匯出。');
    } finally {
      setIsExportingPDF(false);
      setPdfProgress('');
    }
  };

  const renderTimetableTable = (gridData: { titleRow?: string; headers: string[]; rows: string[][]; footer?: string }) => {
    const theme = THEMES[selectedTheme];
    return (
      <div className="bg-white p-6 rounded-lg overflow-x-auto border border-[#E5E1D5]">
        {gridData.titleRow && <h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">{gridData.titleRow}</h2>}
        
        <table className="w-full border-collapse min-w-[700px] shadow-sm text-sm">
          <thead>
            <tr>
              {gridData.headers.map((h, i) => (
                <th key={i} className="py-3 px-4 border text-center font-bold" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="bg-white">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-3 px-4 border text-center whitespace-pre-wrap leading-relaxed text-[#2D2D2A]" style={{ borderColor: theme.cssBorder }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {gridData.footer && <div className="mt-4 font-bold text-sm text-[#4A4A3A]">{gridData.footer}</div>}
      </div>
    );
  };

  const renderPreview = () => {
    const items = getAllExportGridData();
    if (items.length === 0) {
      return <div className="p-12 text-center text-[#8A8475]">請先選擇要匯出的項目以檢視預覽</div>;
    }
    return renderTimetableTable(items[0].gridData);
  };

  let listData: {id: string, name: string}[] = [];
  if (exportType === 'student') listData = students;
  else if (exportType === 'teacher') listData = teachers;
  else if (exportType === 'classroom') listData = classrooms;

  const isActionDisabled = exportType !== 'grade' && selectedIds.length === 0;
  const allExportItems = getAllExportGridData();

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
      <div className="w-1/2 p-6 flex flex-col bg-[#FDFBF7] overflow-y-auto">
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

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">表格風格</h4>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedTheme === key ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm' : 'bg-white border-[#D9D4C7] hover:border-[#BCB6A4]'}`}>
                  <input type="radio" name="theme" checked={selectedTheme === key} onChange={() => setSelectedTheme(key as ThemeKey)} className="text-[#5A5A40] focus:ring-[#5A5A40]" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: THEMES[key].cssBg, borderColor: THEMES[key].cssBorder }}></div>
                    <span className="text-sm font-medium text-[#2D2D2A]">{THEMES[key].name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isDownloadMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDownloadMenuOpen(false)}
        />
      )}

      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        {/* Floating Sub-Buttons (Excel / PDF) */}
        {isDownloadMenuOpen && (
          <div className="flex flex-col items-end gap-3 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* PDF Option */}
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-medium rounded-lg shadow-md">
                下載 PDF (.pdf)
              </span>
              <button 
                onClick={handleExportPDF}
                disabled={isActionDisabled || isExportingPDF}
                className="w-12 h-12 rounded-full bg-[#E11D48] text-white hover:bg-[#BE123C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="下載 PDF"
              >
                <FileText size={20} />
              </button>
            </div>

            {/* Excel Option */}
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-medium rounded-lg shadow-md">
                下載 Excel (.xlsx)
              </span>
              <button 
                onClick={handleExportExcel}
                disabled={isActionDisabled || isExportingPDF}
                className="w-12 h-12 rounded-full bg-[#16A34A] text-white hover:bg-[#15803D] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="下載 Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Preview Button */}
        <button 
          onClick={() => setIsPreviewOpen(true)}
          disabled={isActionDisabled || isExportingPDF}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isActionDisabled ? 'bg-[#E5E1D5] text-[#8A8475] cursor-not-allowed' : 'bg-white text-[#5A5A40] hover:bg-[#F9F8F4] border border-[#D9D4C7]'}`}
          title="預覽課表"
        >
          <Eye size={24} />
        </button>

        {/* Main Download Toggle Button */}
        <button 
          onClick={() => {
            if (!isActionDisabled && !isExportingPDF) {
              setIsDownloadMenuOpen(!isDownloadMenuOpen);
            }
          }}
          disabled={isActionDisabled || isExportingPDF}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isActionDisabled ? 'bg-[#E5E1D5] text-[#8A8475] cursor-not-allowed' : isDownloadMenuOpen ? 'bg-[#4A4A3A] text-white rotate-90' : 'bg-[#5A5A40] text-white hover:bg-[#4A4A3A]'}`}
          title={isDownloadMenuOpen ? '關閉選單' : '下載課表'}
        >
          {isExportingPDF ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isDownloadMenuOpen ? (
            <X size={24} />
          ) : (
            <Download size={24} />
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-[#FDFBF7] w-full max-w-5xl max-h-full rounded-2xl shadow-2xl flex flex-col border border-[#E5E1D5] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E1D5] flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-[#4A4A3A]">課表預覽</h2>
              <div className="flex items-center gap-4">
                {exportType !== 'grade' && selectedIds.length > 1 && (
                  <span className="text-sm font-medium text-[#8A8475] bg-[#F9F8F4] px-3 py-1 rounded-full border border-[#E5E1D5]">
                    僅顯示第一筆資料作為預覽
                  </span>
                )}
                <button onClick={() => setIsPreviewOpen(false)} className="text-[#8A8475] hover:text-[#4A4A3A] transition-colors p-1 bg-[#F9F8F4] rounded-full hover:bg-[#E5E1D5]">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#FDFBF7]">
              {renderPreview()}
            </div>
            <div className="p-4 bg-white border-t border-[#E5E1D5] flex justify-between items-center">
              <button onClick={() => setIsPreviewOpen(false)} className="px-5 py-2 text-sm font-bold text-[#5A5A40] hover:bg-[#F9F8F4] rounded-lg transition-colors border border-[#D9D4C7]">
                關閉預覽
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    await handleExportPDF();
                  }} 
                  disabled={isExportingPDF}
                  className="px-5 py-2 text-sm font-bold bg-[#E11D48] text-white rounded-lg hover:bg-[#BE123C] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FileText size={16} /> 下載 PDF
                </button>
                <button 
                  onClick={handleExportExcel} 
                  className="px-5 py-2 text-sm font-bold bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FileSpreadsheet size={16} /> 下載 Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Progress Overlay */}
      {isExportingPDF && (
        <div className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl border border-[#E5E1D5] flex flex-col items-center gap-4">
            <Loader2 size={36} className="text-[#E11D48] animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-[#2D2D2A] text-base mb-1">正在匯出 PDF 課表</h3>
              <p className="text-xs text-[#8A8475]">{pdfProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Render Container for high-quality PDF html2canvas capture */}
      <div 
        ref={pdfContainerRef} 
        className="fixed left-[-9999px] top-0 pointer-events-none"
        style={{ width: '1080px' }}
      >
        {allExportItems.map((item, idx) => (
          <div key={idx} className="bg-white p-8 mb-8" style={{ width: '1080px' }}>
            {item.gridData.titleRow && (
              <h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">
                {item.gridData.titleRow}
              </h2>
            )}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {item.gridData.headers.map((h, hIdx) => (
                    <th 
                      key={hIdx} 
                      className="py-3 px-3 border text-center font-bold text-base"
                      style={{ 
                        backgroundColor: THEMES[selectedTheme].cssBg, 
                        color: THEMES[selectedTheme].cssText, 
                        borderColor: THEMES[selectedTheme].cssBorder 
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.gridData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white">
                    {row.map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className="py-3 px-3 border text-center whitespace-pre-wrap leading-relaxed text-sm text-[#2D2D2A]"
                        style={{ borderColor: THEMES[selectedTheme].cssBorder }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {item.gridData.footer && (
              <div className="mt-4 font-bold text-sm text-[#4A4A3A]">
                {item.gridData.footer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



