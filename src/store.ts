import { create } from 'zustand';
import { TimeSlot, Teacher, Classroom, Student, Course, Enrollment, Category } from './types';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

interface AppState {
  timeSlots: TimeSlot[];
  setTimeSlots: Setter<TimeSlot[]>;
  teachers: Teacher[];
  setTeachers: Setter<Teacher[]>;
  classrooms: Classroom[];
  setClassrooms: Setter<Classroom[]>;
  categories: Category[];
  setCategories: Setter<Category[]>;
  students: Student[];
  setStudents: Setter<Student[]>;
  courses: Course[];
  setCourses: Setter<Course[]>;
  enrollments: Enrollment[];
  setEnrollments: Setter<Enrollment[]>;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: 'tearly', name: '早自修', startTime: '07:30', endTime: '08:15' },
  { id: 't1', name: '第一節', startTime: '08:20', endTime: '09:05' },
  { id: 't2', name: '第二節', startTime: '09:15', endTime: '10:00' },
  { id: 't3', name: '第三節', startTime: '10:10', endTime: '10:55' },
  { id: 't4', name: '第四節', startTime: '11:05', endTime: '11:50' },
  { id: 'tlunch', name: '午休', startTime: '12:20', endTime: '13:05' },
  { id: 't5', name: '第五節', startTime: '13:10', endTime: '13:55' },
  { id: 't6', name: '第六節', startTime: '14:05', endTime: '14:50' },
  { id: 't7', name: '第七節', startTime: '15:05', endTime: '15:50' },
  { id: 't8', name: '第八節', startTime: '16:00', endTime: '16:45' }
];

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return defaultValue;
    const parsed = JSON.parse(saved);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    return parsed;
  } catch (e) {
    return defaultValue;
  }
};

const createSetter = <T,>(key: string, isArray: boolean = true) => (
  set: (fn: (state: AppState) => Partial<AppState>) => void,
  prop: keyof AppState
) => (value: T | ((prev: T) => T)) => {
  set((state) => {
    const prev = state[prop] as unknown as T;
    const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
    const safeNext = isArray && !Array.isArray(next) ? ([] as unknown as T) : next;
    try {
      localStorage.setItem(key, JSON.stringify(safeNext));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
    }
    return { [prop]: safeNext } as Partial<AppState>;
  });
};

export const useAppStore = create<AppState>((set) => ({
  timeSlots: loadFromStorage('timeSlots', defaultTimeSlots),
  setTimeSlots: (value) => createSetter<TimeSlot[]>('timeSlots', true)(set, 'timeSlots')(value),
  
  teachers: loadFromStorage('teachers', []),
  setTeachers: (value) => createSetter<Teacher[]>('teachers', true)(set, 'teachers')(value),
  
  classrooms: loadFromStorage('classrooms', []),
  setClassrooms: (value) => createSetter<Classroom[]>('classrooms', true)(set, 'classrooms')(value),
  
  categories: loadFromStorage('categories', []),
  setCategories: (value) => createSetter<Category[]>('categories', true)(set, 'categories')(value),
  
  students: loadFromStorage('students', []),
  setStudents: (value) => createSetter<Student[]>('students', true)(set, 'students')(value),
  
  courses: loadFromStorage('courses', []),
  setCourses: (value) => createSetter<Course[]>('courses', true)(set, 'courses')(value),
  
  enrollments: loadFromStorage('enrollments', []),
  setEnrollments: (value) => createSetter<Enrollment[]>('enrollments', true)(set, 'enrollments')(value),
}));

