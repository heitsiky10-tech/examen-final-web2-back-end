import { Choice, ChoiceInputDTO } from './Choice';

export interface Question {
  id: number;
  exam_id: number;
  statement: string;
  points: number;
  position: number;
  choices: Choice[];
}

export interface QuestionInputDTO {
  statement: string;
  points?: number;
  position?: number;
  choices: ChoiceInputDTO[];
}