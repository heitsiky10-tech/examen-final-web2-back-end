export interface Choice {
  id: number;
  text: string;
  is_correct: boolean;
  question_id: number;
}

export type ChoiceInputDTO = {
  text: string;
  is_correct: boolean;
};