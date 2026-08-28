export interface Attempt {
  id: number;
  user_id: number;
  exam_id: number;
  score: number;
  submitted_at: Date;
}

export interface AnswerSubmissionDTO {
  question_id: number;
  choice_id: number;
}