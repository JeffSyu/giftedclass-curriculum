import { useState, useEffect } from 'react';
import { TimeSlot, Teacher, Classroom, Student, Course, Enrollment, Category } from './types';

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

export function useAppStore() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem('timeSlots');
    return saved ? JSON.parse(saved) : defaultTimeSlots;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('teachers');
    return saved ? JSON.parse(saved) : [];
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('classrooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('courses');
    return saved ? JSON.parse(saved) : [];
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    const saved = localStorage.getItem('enrollments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
  }, [timeSlots]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  return {
    timeSlots, setTimeSlots,
    teachers, setTeachers,
    classrooms, setClassrooms,
    categories, setCategories,
    students, setStudents,
    courses, setCourses,
    enrollments, setEnrollments
  };
}
