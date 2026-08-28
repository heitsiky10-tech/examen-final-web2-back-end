export interface Exam {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  starts_at: Date;
  ends_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ExamInputDTO {
  course_id: number;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
}

export interface ExamWithDetails extends Exam {
  course: { id: number; code: string; name: string };
  question_count: number;
  attempt_count: number;
}