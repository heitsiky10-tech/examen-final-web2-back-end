export interface Course {
    id: number;
    code: string;
    name: string;
    description?: string;
    exam_count?: number;
    created_at?: Date;
    updated_at?: Date;
}

export type CourseDTO = Omit<Course, 'id' | 'exam_count'>;