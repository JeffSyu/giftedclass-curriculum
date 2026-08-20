export type Grade = 7 | 8 | 9;

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface Classroom {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  categoryIds?: string[];
}

export interface Course {
  id: string;
  name: string;
  timeSlotIds: string[]; // e.g., "1_early", "5_3" (dayOfWeek_periodId)
  teacherIds: string[];
  classroomId: string;
  targetGrades: Grade[];
  targetCategoryIds?: string[];
}

export interface Enrollment {
  studentId: string;
  courseIds: string[];
}
