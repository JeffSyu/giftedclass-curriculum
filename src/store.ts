import { useState, useEffect } from 'react';
import { TimeSlot, Teacher, Classroom, Student, Course, Enrollment } from './types';

const defaultTimeSlots: TimeSlot[] = [
  { id: 'early', name: '早自修', startTime: '07:50', endTime: '08:30' },
  { id: '1', name: '第一節', startTime: '08:40', endTime: '09:25' },
  { id: '2', name: '第二節', startTime: '09:35', endTime: '10:20' },
  { id: '3', name: '第三節', startTime: '10:30', endTime: '11:15' },
  { id: '4', name: '第四節', startTime: '11:25', endTime: '12:10' },
  { id: 'lunch', name: '午休', startTime: '12:10', endTime: '13:00' },
  { id: '5', name: '第五節', startTime: '13:00', endTime: '13:45' },
  { id: '6', name: '第六節', startTime: '13:55', endTime: '14:40' },
  { id: '7', name: '第七節', startTime: '14:50', endTime: '15:35' },
  { id: '8', name: '第八節', startTime: '15:45', endTime: '16:30' }
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
    students, setStudents,
    courses, setCourses,
    enrollments, setEnrollments
  };
}
