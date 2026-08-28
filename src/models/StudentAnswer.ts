export interface StudentAnswer {
    id: number;
    attemptId: number;
    question_id: number;
    choice_id: number;
}

export type CreatStudentAnswerDTO = Omit<StudentAnswer, 'id'>