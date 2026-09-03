import React, { useState, useRef } from 'react';
import { Student, Teacher, Classroom, Course, Enrollment, TimeSlot } from '../types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ArrowDownToLine, FileSearch, X, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';

interface ExportProps {
  students: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  courses: Course[];
  enrollments: Enrollment[];
  timeSlots: TimeSlot[];
}

const THEMES = {
  default: { name: '預設', headerBg: 'FFF3F4F6', headerText: 'FF1F2937', border: 'FFD1D5DB', cssBg: '#F3F4F6', cssText: '#1F2937', cssBorder: '#D1D5DB' },
  blue: { name: '天空', headerBg: 'FFE8F0FE', headerText: 'FF174EA6', border: 'FF8AB4F8', cssBg: '#E8F0FE', cssText: '#174EA6', cssBorder: '#8AB4F8' },
  green: { name: '森林', headerBg: 'FFE6F4EA', headerText: 'FF0D652D', border: 'FF81C995', cssBg: '#E6F4EA', cssText: '#0D652D', cssBorder: '#81C995' },
  warm: { name: '夕陽', headerBg: 'FFFCE8E6', headerText: 'FFA50E0E', border: 'FFF28B82', cssBg: '#FCE8E6', cssText: '#A50E0E', cssBorder: '#F28B82' },
};
type ThemeKey = keyof typeof THEMES;


interface RichTextChunk {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  size: 'normal' | 'large' | 'small';
}

const parseStyledText = (input: string): RichTextChunk[] => {
  if (!input) return [];
  const regex = /(\[粗體\]|\[斜體\]|\[底線\]|\[大字體\]|\[小字體\]|\[預設\])/g;
  const parts = input.split(regex);
  
  let currentState = { bold: false, italic: false, underline: false, size: 'normal' as 'normal' | 'large' | 'small' };
  const chunks: RichTextChunk[] = [];
  
  parts.forEach(part => {
    if (!part) return;
    switch (part) {
      case '[粗體]': currentState.bold = true; break;
      case '[斜體]': currentState.italic = true; break;
      case '[底線]': currentState.underline = true; break;
      case '[大字體]': currentState.size = 'large'; break;
      case '[小字體]': currentState.size = 'small'; break;
      case '[預設]': 
        currentState = { bold: false, italic: false, underline: false, size: 'normal' }; 
        break;
      default:
        chunks.push({
          text: part,
          bold: currentState.bold,
          italic: currentState.italic,
          underline: currentState.underline,
          size: currentState.size
        });
    }
  });
  return chunks;
};

const renderReactRichText = (input: string) => {
  if (!/\[(粗體|斜體|底線|大字體|小字體|預設)\]/.test(input)) return input;
  
  const chunks = parseStyledText(input);
  return (
    <>
      {chunks.map((chunk, i) => {
        let classes = [];
        if (chunk.bold) classes.push('font-bold');
        if (chunk.italic) classes.push('italic');
        if (chunk.underline) classes.push('underline');
        if (chunk.size === 'large') classes.push('text-lg');
        else if (chunk.size === 'small') classes.push('text-xs');
        
        return <span key={i} className={classes.join(' ')}>{chunk.text}</span>;
      })}
    </>
  );
};

const getExcelRichText = (input: string, baseFontName = 'Microsoft JhengHei', isFirstCol = false) => {
  if (!/\[(粗體|斜體|底線|大字體|小字體|預設)\]/.test(input)) {
    return input;
  }
  
  const chunks = parseStyledText(input);
  const baseSize = isFirstCol ? 12 : 11;
  const baseBold = isFirstCol;
  
  return {
    richText: chunks.map(chunk => {
      let size = baseSize;
      if (chunk.size === 'large') size = baseSize + 3;
      if (chunk.size === 'small') size = baseSize - 2;
      
      return {
        text: chunk.text,
        font: {
          name: baseFontName,
          size: size,
          bold: baseBold || chunk.bold,
          italic: chunk.italic,
          underline: chunk.underline ? true : false,
        }
      };
    })
  };
};

export default function ExportView({ students, teachers, classrooms, courses, enrollments, timeSlots }: ExportProps) {
  const [exportType, setExportType] = useState<'student' | 'teacher' | 'classroom' | 'grade' | 'attendance' | 'pullout'>('student');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Student Filters
  const [filterStudentGrade, setFilterStudentGrade] = useState<number | ''>('');
  const [filterStudentCategory, setFilterStudentCategory] = useState<string>('');

  // Settings
  const [showTitle, setShowTitle] = useState(true);
  const [titleText, setTitleText] = useState('特殊教育課表');
  const [showEntityName, setShowEntityName] = useState(false);
  const [entityNamePosition, setEntityNamePosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-left');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  // Course Info Template
  const [courseInfoTemplate, setCourseInfoTemplate] = useState<string>("");
  const templateTags = ['[課程名稱]', '[年級]', '[類別]', '[教師]', '[教室]', '[學生]'];
  const styleTags = ['[粗體]', '[斜體]', '[底線]', '[大字體]', '[小字體]', '[預設]'];

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    if (templateTextareaRef.current) {
      const textarea = templateTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = courseInfoTemplate.substring(0, start) + tag + courseInfoTemplate.substring(end);
      setCourseInfoTemplate(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setCourseInfoTemplate(prev => prev + tag);
    }
  };

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

  const formatCourseInfo = (c: Course, targetClass?: string, targetGrade?: number) => {
    let text = courseInfoTemplate;
    text = text.replace(/\[課程名稱\]/g, c.name || '');
    text = text.replace(/\[年級\]/g, (c.targetGrades || []).join(','));
    
    let catText = '';
    if (c.targetCategoryIds && c.targetCategoryIds.length > 0) {
      catText = c.targetCategoryIds.map(cid => categories.find(cat => cat.id === cid)?.name).filter(Boolean).join(',');
    }
    text = text.replace(/\[類別\]/g, catText);
    
    let teacherText = '';
    if (c.teacherIds && c.teacherIds.length > 0) {
      teacherText = c.teacherIds.map(tid => teachers.find(t => t.id === tid)?.name).filter(Boolean).join(',');
    }
    text = text.replace(/\[教師\]/g, teacherText);
    
    let roomText = '';
    if (c.classroomId) {
      roomText = classrooms.find(r => r.id === c.classroomId)?.name || '';
    }
    text = text.replace(/\[教室\]/g, roomText);
    
    let studentText = '';
    const enrolledStudentIds = enrollments.filter(e => e.courseIds.includes(c.id)).map(e => e.studentId);
    let enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
    if (targetClass && targetGrade !== undefined) {
      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass && s.grade === targetGrade);
    } else if (targetClass) {
      enrolledStudents = enrolledStudents.filter(s => s.className === targetClass);
    }
    studentText = enrolledStudents.map(s => s.name).join('、');
    text = text.replace(/\[學生\]/g, studentText);
    
    return text.split('\n').filter(line => line.trim() !== '').join('\n');
  };

  
  const generateAttendanceGridData = (course: Course) => {
    const daysMap = { '1': '星期一', '2': '星期二', '3': '星期三', '4': '星期四', '5': '星期五' };
    
    const courseTimeSlots = (course.timeSlotIds || []).map(slotKey => {
      const [d, tsId] = slotKey.split('_');
      const ts = timeSlots.find(t => t.id === tsId);
      return {
        slotKey,
        day: d,
        tsId,
        tsName: ts ? ts.name : '',
        dayName: (daysMap as any)[d] || '',
        startTime: ts ? ts.startTime : ''
      };
    });
    
    courseTimeSlots.sort((a, b) => {
      if (a.day !== b.day) return Number(a.day) - Number(b.day);
      return a.startTime.localeCompare(b.startTime);
    });

    const headers = ['節次', ...courseTimeSlots.map(ts => `${ts.dayName} ${ts.tsName}`)];
    if (headers.length === 1) headers.push('無排定時段');
    
    const enrolledStudentIds = enrollments
      .filter(e => e.courseIds.includes(course.id))
      .map(e => e.studentId);
    
    const enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
    
    enrolledStudents.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      const classA = a.className || '';
      const classB = b.className || '';
      if (classA !== classB) return classA.localeCompare(classB);
      return a.name.localeCompare(b.name);
    });

    const rows: string[][] = enrolledStudents.map(s => {
      const row = [s.name];
      for (let i = 1; i < headers.length; i++) {
        row.push('');
      }
      return row;
    });
    
    return {
      titleRow: (showTitle && titleText) ? titleText : undefined,
      subTitleRow: courseInfoTemplate.trim() ? formatCourseInfo(course) : undefined,
      headers,
      rows,
            headerLeft: showEntityName && entityNamePosition === 'top-left' ? `課程名稱：${course.name}` : undefined,
      headerRight: showEntityName && entityNamePosition === 'top-right' ? `課程名稱：${course.name}` : undefined,
      footerLeft: showEntityName && entityNamePosition === 'bottom-left' ? `課程名稱：${course.name}` : undefined,
      footerRight: showEntityName && entityNamePosition === 'bottom-right' ? `課程名稱：${course.name}` : undefined
    };
  };

  const generateGridData = (coursesForEntity: Course[], entityName: string, entityTypeLabel: string, targetClass?: string, targetGrade?: number) => {
    // Map slotKey (day_period) -> course formatted strings
    const slotMap = new Map<string, string[]>();
    coursesForEntity.forEach(c => {
      const formatted = formatCourseInfo(c, targetClass, targetGrade);
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
      subTitleRow: undefined as string | undefined,
      headers,
      rows,
            headerLeft: showEntityName && entityNamePosition === 'top-left' ? `${entityTypeLabel}：${entityName}` : undefined,
      headerRight: showEntityName && entityNamePosition === 'top-right' ? `${entityTypeLabel}：${entityName}` : undefined,
      footerLeft: showEntityName && entityNamePosition === 'bottom-left' ? `${entityTypeLabel}：${entityName}` : undefined,
      footerRight: showEntityName && entityNamePosition === 'bottom-right' ? `${entityTypeLabel}：${entityName}` : undefined
    };
  };

  const getAllExportGridData = () => {
    const result: { title: string; filename: string; gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; headerLeft?: string; headerRight?: string; footerLeft?: string; footerRight?: string; } }[] = [];
    
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
      selectedIds.forEach(gradeStr => {
        const gradeNum = Number(gradeStr);
        const gradeCourses = courses.filter(c => (c.targetGrades || []).includes(gradeNum as any));
        const gridData = generateGridData(gradeCourses, `${gradeNum}年級總表`, '年級');
        result.push({
          title: `${gradeNum}年級總表`,
          filename: `${gradeNum}年級總表`,
          gridData
        });
      });

    } else if (exportType === 'pullout') {
      selectedIds.forEach(classId => {
        const [gradeStr, className] = classId.split('_');
        const grade = Number(gradeStr);
        const classStudents = students.filter(s => s.grade === grade && s.className === className);
        const classStudentIds = classStudents.map(s => s.id);
        const classEnrollments = enrollments.filter(e => classStudentIds.includes(e.studentId));
        const courseIds = new Set<string>();
        classEnrollments.forEach(e => {
          e.courseIds.forEach(cid => courseIds.add(cid));
        });
        const pulloutCourses = courses.filter(c => courseIds.has(c.id));
        const gridData = generateGridData(pulloutCourses, `${grade}年級${className}班`, '班級', className, grade);
        result.push({
          title: `${grade}年級${className}班 原班抽課表`,
          filename: `${grade}年級${className}班_原班抽課表`,
          gridData
        });
      });
    } else if (exportType === 'attendance') {
      const targetCourses = courses.filter(c => selectedIds.includes(c.id));
      targetCourses.forEach(course => {
        const gridData = generateAttendanceGridData(course);
        result.push({
          title: `${course.name} - 週點名單`,
          filename: `${course.name}_週點名單`,
          gridData
        });
      });
    }
    return result;
  };

  const buildWorksheet = (worksheet: ExcelJS.Worksheet, gridData: any) => {
    const themeColor = THEMES[selectedTheme];
    let currentRow = 1;
    worksheet.pageSetup.orientation = orientation;

    if (orientation === 'portrait') {
      worksheet.columns = [
        { width: 6 },
        { width: 10 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
      ];
    } else {
      worksheet.columns = [
        { width: 8 },
        { width: 14 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
      ];
    }


    const getColLetter = (colNum: number) => {
      let temp, letter = '';
      while (colNum > 0) {
        temp = (colNum - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colNum = (colNum - temp - 1) / 26;
      }
      return letter;
    };

    if (gridData.titleRow) {
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = gridData.titleRow;
      titleCell.font = { size: 16, bold: true, name: 'Microsoft JhengHei' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`A${currentRow}:${getColLetter(gridData.headers.length)}${currentRow}`);
      worksheet.getRow(currentRow).height = 30;
      currentRow += 2; // skip a row
    }


    if (gridData.subTitleRow) {
      const subTitleCell = worksheet.getCell(`A${currentRow}`);
              if (typeof gridData.subTitleRow === 'string' && /\[(粗體|斜體|底線|大字體|小字體|預設)\]/.test(gridData.subTitleRow)) {
          subTitleCell.value = getExcelRichText(gridData.subTitleRow, 'Microsoft JhengHei', false);
        } else {
          subTitleCell.value = gridData.subTitleRow;
        }
        if (!subTitleCell.value || typeof subTitleCell.value !== 'object' || !('richText' in subTitleCell.value)) {
          subTitleCell.font = { name: 'Microsoft JhengHei', size: 12 };
        }
        subTitleCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
      worksheet.mergeCells(`A${currentRow}:${getColLetter(gridData.headers.length)}${currentRow}`);
      const lines = (gridData.subTitleRow.match(/\n/g) || []).length + 1;
      worksheet.getRow(currentRow).height = lines * 18 + 10;
      currentRow += 1;
    }

    if (gridData.headerLeft || gridData.headerRight) {
      if (gridData.headerLeft) {
        const hCell = worksheet.getCell(`A${currentRow}`);
        hCell.value = gridData.headerLeft;
        hCell.font = { name: 'Microsoft JhengHei', bold: true };
        hCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (gridData.headerRight) {
        const lastCol = getColLetter(gridData.headers.length);
        const hCell = worksheet.getCell(`${lastCol}${currentRow}`);
        hCell.value = gridData.headerRight;
        hCell.font = { name: 'Microsoft JhengHei', bold: true };
        hCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      currentRow += 1;
    }
    // Headers
    const headerRow = worksheet.getRow(currentRow);
    gridData.headers.forEach((h: string, i: number) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor.headerBg } };
      cell.font = { bold: true, color: { argb: themeColor.headerText }, name: 'Microsoft JhengHei', size: 12 };
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
        if (typeof val === 'string' && /\[(粗體|斜體|底線|大字體|小字體|預設)\]/.test(val)) {
          cell.value = getExcelRichText(val, 'Microsoft JhengHei', i === 0);
        } else {
          cell.value = val;
        }
        if (!cell.value || typeof cell.value !== 'object' || !('richText' in cell.value)) {
          cell.font = { name: 'Microsoft JhengHei', bold: i === 0, size: i === 0 ? 12 : 11 };
        }
        cell.alignment = { horizontal: 'center', vertical: i < 2 ? 'middle' : 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: themeColor.border } },
          left: { style: 'thin', color: { argb: themeColor.border } },
          bottom: { style: 'thin', color: { argb: themeColor.border } },
          right: { style: 'thin', color: { argb: themeColor.border } }
        };
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      });
      row.height = orientation === 'landscape' ? 45 : 70;
      currentRow++;
    });

    if (gridData.footerLeft || gridData.footerRight) {
      currentRow++; // empty row
      if (gridData.footerLeft) {
        const fCell = worksheet.getCell(`A${currentRow}`);
        fCell.value = gridData.footerLeft;
        fCell.font = { name: 'Microsoft JhengHei', bold: true };
        fCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (gridData.footerRight) {
        const lastCol = getColLetter(gridData.headers.length);
        const fCell = worksheet.getCell(`${lastCol}${currentRow}`);
        fCell.value = gridData.footerRight;
        fCell.font = { name: 'Microsoft JhengHei', bold: true };
        fCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }

    // Column widths
    if (exportType === 'attendance') {
      worksheet.getColumn(1).width = 16;
      for (let i = 2; i <= gridData.headers.length; i++) {
        worksheet.getColumn(i).width = 16;
      }
    } else {
      worksheet.getColumn(1).width = 12;
      worksheet.getColumn(2).width = 16;
      for (let i = 3; i <= gridData.headers.length; i++) {
        worksheet.getColumn(i).width = 22;
      }
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
        orientation: orientation,
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
        const pageWidth = orientation === 'landscape' ? 297 : 210;
        const pageHeight = orientation === 'landscape' ? 210 : 297;
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
          pdf.addPage('a4', orientation);
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

  const renderTimetableTable = (gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; headerLeft?: string; headerRight?: string; footerLeft?: string; footerRight?: string; }) => {
    const theme = THEMES[selectedTheme];
    return (
      <div className="bg-white p-6 rounded-lg overflow-x-auto border border-[#E5E1D5]">
        {gridData.titleRow && <h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">{gridData.titleRow}</h2>}
        {gridData.subTitleRow && <div className="text-m text-[#4A4A3A] mb-4 whitespace-pre-wrap leading-relaxed text-center">{renderReactRichText(gridData.subTitleRow)}</div>}
        
        {(gridData.headerLeft || gridData.headerRight) && (
          <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mb-2 px-1">
            <div>{gridData.headerLeft}</div>
            <div>{gridData.headerRight}</div>
          </div>
        )}
        <table className="border-collapse shadow-sm text-sm mx-auto" style={{ tableLayout: 'fixed', width: orientation === 'landscape' ? '1000px' : '700px' }}>
          <thead>
            <tr>
              {gridData.headers.map((h, i) => (
                <th key={i} className="py-3 px-2 border text-center align-middle font-bold text-base" style={{ backgroundColor: theme.cssBg, color: theme.cssText, borderColor: theme.cssBorder, width: i === 0 ? '8%' : i === 1 ? '12%' : '16%' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="bg-white">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-base font-bold' : ''}`} style={{ borderColor: theme.cssBorder, overflow: 'hidden' }}>
                    <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: cIdx < 2 ? 'flex' : 'block', flexDirection: cIdx < 2 ? 'column' : 'row', justifyContent: cIdx < 2 ? 'center' : 'flex-start', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderReactRichText(cell)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {(gridData.footerLeft || gridData.footerRight) && (
          <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mt-4 px-1">
            <div>{gridData.footerLeft}</div>
            <div>{gridData.footerRight}</div>
          </div>
        )}
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

  let listData: {id: string, name: string, grade?: number}[] = [];
  if (exportType === 'student') {
    let filtered = students;
    if (filterStudentGrade !== '') {
      filtered = filtered.filter(s => s.grade === filterStudentGrade);
    }
    if (filterStudentCategory !== '') {
      filtered = filtered.filter(s => (s.categoryIds || []).includes(filterStudentCategory));
    }
    listData = filtered;
  }
  else if (exportType === 'teacher') listData = teachers;
  else if (exportType === 'classroom') listData = classrooms;
  else if (exportType === 'attendance') listData = courses;

  else if (exportType === 'pullout') {
    const classesSet = new Set<string>();
    students.forEach(s => {
      if (s.className && s.grade) {
        classesSet.add(`${s.grade}_${s.className}`);
      }
    });
    listData = Array.from(classesSet).map(cStr => {
      const [g, c] = cStr.split('_');
      return { id: cStr, name: `${c}班`, grade: Number(g) };
    }).sort((a, b) => {
      if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
      const numA = parseInt(a.name) || 0;
      const numB = parseInt(b.name) || 0;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }
  else if (exportType === 'grade') {
    listData = [
      { id: '7', name: '七年級' },
      { id: '8', name: '八年級' },
      { id: '9', name: '九年級' }
    ];
  }

  const isActionDisabled = selectedIds.length === 0;
  const allExportItems = getAllExportGridData();

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-[#E5E1D5] overflow-hidden relative">
      {/* Left panel: List */}
      <div className="w-1/2 flex flex-col border-r border-[#E5E1D5]">
        <div className="flex bg-[#F9F8F4] border-b border-[#E5E1D5] px-4 pt-4 gap-6">
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'student' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('student'); setSelectedIds([]);}}>學生課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'teacher' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('teacher'); setSelectedIds([]);}}>教師課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'classroom' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('classroom'); setSelectedIds([]);}}>教室課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'grade' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('grade'); setSelectedIds([]);}}>年級課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'pullout' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('pullout'); setSelectedIds([]);}}>原班抽課表</button>
          <button className={`pb-3 font-medium text-sm focus:outline-none transition-colors ${exportType === 'attendance' ? 'border-b-2 border-[#5A5A40] text-[#4A4A3A] font-bold' : 'text-[#8A8475] border-b-2 border-transparent hover:text-[#5A5A40]'}`} onClick={() => {setExportType('attendance'); setSelectedIds([]);}}>週點名單</button>

        </div>
        
        <div className="flex-1 flex flex-col overflow-y-hidden bg-white">
          {exportType === 'student' && (
            <div className="p-4 border-b border-[#E5E1D5] bg-[#FDFBF7] flex gap-3">
              <select 
                value={filterStudentGrade} 
                onChange={e => setFilterStudentGrade(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 px-3 py-2 text-sm bg-white border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] outline-none"
              >
                <option value="">所有年級</option>
                <option value={7}>七年級</option>
                <option value={8}>八年級</option>
                <option value={9}>九年級</option>
              </select>
              <select 
                value={filterStudentCategory} 
                onChange={e => setFilterStudentCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white border border-[#D9D4C7] rounded-lg focus:ring-1 focus:ring-[#5A5A40] outline-none"
              >
                <option value="">所有類別</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-[#4A4A3A]">清單 ({listData.length} 筆)</span>
              <div className="flex gap-3 text-sm">
                <button onClick={() => selectAll(listData.map(d => d.id))} className="text-[#5A5A40] hover:text-[#4A4A3A] font-medium">全選</button>
                <button onClick={clearSelection} className="text-[#8A8475] hover:text-[#5A5A40] font-medium">清除</button>
              </div>
            </div>
            {exportType === 'pullout' ? (
              <div className="space-y-4">
                {[7, 8, 9].map(grade => {
                  const gradeItems = listData.filter((item: any) => item.grade === grade);
                  if (gradeItems.length === 0) return null;
                  return (
                    <div key={grade}>
                      <h4 className="text-sm font-bold text-[#8A8475] mb-2">{grade}年級</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {gradeItems.map(item => (
                          <label key={item.id} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${selectedIds.includes(item.id) ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm text-[#4A4A3A] font-medium' : 'hover:bg-[#F9F8F4] border-[#E5E1D5] text-[#2D2D2A]'}`}>
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                            <span className="text-sm truncate">{item.name}</span>
                          </label>
                        ))}
                      </div>
    </div>
  );
})}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Settings */}
      <div className="w-1/2 p-6 flex flex-col bg-[#FDFBF7] overflow-y-auto">
        <h3 className="text-lg font-medium text-[#4A4A3A] mb-6">匯出設定</h3>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">表首表尾</h4>
            
            <label className="flex items-center gap-3 p-3 bg-white border border-[#D9D4C7] rounded-lg">
              <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-medium text-[#2D2D2A]">標題列</span>
                {showTitle && (
                  <input type="text" value={titleText} onChange={e => setTitleText(e.target.value)} placeholder="請輸入標題" className="flex-1 px-3 py-0 text-sm bg-[#F9F8F4] border border-[#D9D4C7] rounded focus:ring-1 focus:ring-[#5A5A40] outline-none" />
                )}
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-[#D9D4C7] rounded-lg">
              <input type="checkbox" checked={showEntityName} onChange={e => setShowEntityName(e.target.checked)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-medium text-[#2D2D2A]">名稱</span>
                {showEntityName && (
                    <select 
                      value={entityNamePosition}
                      onChange={e => setEntityNamePosition(e.target.value as any)}
                      className="flex-1 px-3 py-0 text-sm bg-[#F9F8F4] border border-[#D9D4C7] rounded-md focus:ring-1 focus:ring-[#5A5A40] outline-none text-[#4A4A3A]"
                    >
                      <option value="top-left">表首左上</option>
                      <option value="top-right">表首右上</option>
                      <option value="bottom-left">表尾左下</option>
                      <option value="bottom-right">表尾右下</option>
                    </select>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">課程資訊</h4>
            </div>
            <div className="bg-white border border-[#D9D4C7] rounded-lg overflow-hidden flex flex-col">
              <div className="p-2 border-b border-[#E5E1D5] bg-[#F9F8F4] flex flex-wrap gap-1.5">
                {templateTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => insertTag(tag)}
                    className="px-2 py-1 text-xs font-medium bg-white border border-[#D9D4C7] text-[#5A5A40] rounded hover:bg-[#E5E1D5] hover:text-[#4A4A3A] transition-colors shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
                <div className="w-full h-px bg-[#D9D4C7] my-1" />
                {styleTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => insertTag(tag)}
                    className="px-2 py-1 text-xs font-medium bg-white border border-[#D9D4C7] text-[#5A5A40] rounded hover:bg-[#E5E1D5] hover:text-[#4A4A3A] transition-colors shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                ref={templateTextareaRef}
                value={courseInfoTemplate}
                onChange={e => setCourseInfoTemplate(e.target.value)}
                placeholder="在此編輯課程顯示格式..."
                className="w-full p-3 h-28 resize-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-[#5A5A40] text-sm text-[#2D2D2A] leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">版面方向</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-2 rounded font-bold transition-colors ${orientation === 'portrait' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#D9D4C7] text-[#4A4A3A]'}`}
              >
                直式
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-2 rounded font-bold transition-colors ${orientation === 'landscape' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#D9D4C7] text-[#4A4A3A]'}`}
              >
                橫式
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#8A8475] uppercase tracking-wider">表格配色</h4>
            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map(key => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedTheme === key ? 'bg-[#F9F8F4] border-[#5A5A40] shadow-sm' : 'bg-white border-[#D9D4C7] hover:border-[#BCB6A4]'}`} style={{ backgroundColor: THEMES[key].cssBg, borderColor: THEMES[key].cssBorder }}>
                  <input type="radio" name="theme" checked={selectedTheme === key} onChange={() => setSelectedTheme(key as ThemeKey)} className="text-[#5A5A40] focus:ring-[#5A5A40] hidden" />
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
        {/* Preview Button */}
        <button 
          onClick={() => setIsPreviewOpen(true)}
          disabled={isActionDisabled || isExportingPDF}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isActionDisabled ? 'bg-[#E5E1D5] text-[#8A8475] cursor-not-allowed' : 'bg-white text-[#5A5A40] hover:bg-[#F9F8F4] border border-[#D9D4C7]'}`}
          title="預覽課表"
        >
          <FileSearch size={24} />
        </button>
        
        {/* Floating Sub-Buttons (Excel / PDF) */}
        <AnimatePresence>
          {isDownloadMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-3 overflow-hidden py-1"
            >
              {/* PDF Option */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-2.5"
              >
                <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-medium rounded-lg shadow-md whitespace-nowrap">
                  下載 PDF (.pdf)
                </span>
                <button 
                  onClick={handleExportPDF}
                  disabled={isActionDisabled || isExportingPDF}
                  className="w-12 h-12 rounded-full shrink-0 bg-[#E11D48] text-white hover:bg-[#BE123C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                  title="下載 PDF"
                >
                  <FileText size={20} />
                </button>
              </motion.div>

              {/* Excel Option */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0 }}
                className="flex items-center gap-2.5"
              >
                <span className="px-2.5 py-1 bg-[#2D2D2A] text-white text-xs font-medium rounded-lg shadow-md whitespace-nowrap">
                  下載 Excel (.xlsx)
                </span>
                <button 
                  onClick={handleExportExcel}
                  disabled={isActionDisabled || isExportingPDF}
                  className="w-12 h-12 rounded-full shrink-0 bg-[#16A34A] text-white hover:bg-[#15803D] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                  title="下載 Excel"
                >
                  <FileSpreadsheet size={20} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <ArrowDownToLine size={24} />
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
        style={{ width: orientation === 'landscape' ? '1080px' : '768px' }}
      >
        {allExportItems.map((item, idx) => (
          <div key={idx} className="bg-white p-8 mb-8" style={{ width: orientation === 'landscape' ? '1080px' : '768px' }}>
            {item.gridData.titleRow && (
              <h2 className="text-2xl font-bold text-center mb-6 text-[#2D2D2A]">
                {item.gridData.titleRow}
              </h2>
            )}
            {item.gridData.subTitleRow && (
              <div className="text-m text-[#4A4A3A] mb-4 whitespace-pre-wrap text-center">
                {item.gridData.subTitleRow}
              </div>
            )}
            {(item.gridData.headerLeft || item.gridData.headerRight) && (
              <div className="flex justify-between text-sm font-bold text-[#4A4A3A] mb-2 px-1">
                <div>{item.gridData.headerLeft}</div>
                <div>{item.gridData.headerRight}</div>
              </div>
            )}
            <table className="border-collapse text-sm mx-auto" style={{ tableLayout: 'fixed', width: orientation === 'landscape' ? '1000px' : '700px' }}>
              <thead>
                <tr>
                  {item.gridData.headers.map((h, hIdx) => (
                    <th 
                      key={hIdx} 
                      className="py-3 px-2 border text-center align-middle font-bold text-base"
                      style={{ 
                        backgroundColor: THEMES[selectedTheme].cssBg, 
                        color: THEMES[selectedTheme].cssText, 
                        borderColor: THEMES[selectedTheme].cssBorder,
                        width: hIdx === 0 ? '8%' : hIdx === 1 ? '12%' : '16%'
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
                        className={`p-1 border text-center align-middle text-[#2D2D2A] ${cIdx === 0 ? 'text-base font-bold' : ''}`}
                        style={{ borderColor: THEMES[selectedTheme].cssBorder, overflow: 'hidden' }}
                      >
                        <div style={{ height: orientation === 'landscape' ? '50px' : '80px', overflow: 'hidden', display: cIdx < 2 ? 'flex' : 'block', flexDirection: cIdx < 2 ? 'column' : 'row', justifyContent: cIdx < 2 ? 'center' : 'flex-start', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {renderReactRichText(cell)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {(item.gridData.footerLeft || item.gridData.footerRight) && (
              <div className="flex justify-between mt-4 font-bold text-sm text-[#4A4A3A] px-1">
                <div>{item.gridData.footerLeft}</div>
                <div>{item.gridData.footerRight}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
