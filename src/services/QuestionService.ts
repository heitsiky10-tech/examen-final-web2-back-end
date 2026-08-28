import { QuestionRepository } from '../repositories/QuestionRepository';
import { AttemptRepository } from '../repositories/AttemptRepository';
import { ExamRepository } from '../repositories/ExamRepository';
import { Question, QuestionInputDTO } from '../models/Question';
import { HttpError } from '../security/HttpError';

export class QuestionService {
  private questionRepository: QuestionRepository;
  private attemptRepository: AttemptRepository;
  private examRepository: ExamRepository;

  constructor() {
    this.questionRepository = new QuestionRepository();
    this.attemptRepository = new AttemptRepository();
    this.examRepository = new ExamRepository();
  }

  async getQuestionsByExamId(examId: number): Promise<Question[]> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new HttpError(404, 'Exam not found');
    return this.questionRepository.findByExamId(examId);
  }

  async createQuestion(examId: number, data: QuestionInputDTO): Promise<Question> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new HttpError(404, 'Exam not found');
    const attemptCount = await this.attemptRepository.countByExamId(examId);
    if (attemptCount > 0) {
      throw new HttpError(409, 'Cannot modify questions of an exam that has attempts');
    }

    this.validateQuestionData(data);
    return this.questionRepository.create(examId, data);
  }

  async updateQuestion(id: number, data: QuestionInputDTO): Promise<Question> {
    const existing = await this.questionRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Question not found');
    const attemptCount = await this.attemptRepository.countByExamId(existing.exam_id);
    if (attemptCount > 0) {
      throw new HttpError(409, 'Cannot modify questions of an exam that has attempts');
    }

    this.validateQuestionData(data);
    const updated = await this.questionRepository.update(id, data);
    if (!updated) throw new HttpError(404, 'Question not found');
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.questionRepository.findById(id);
    if (!question) throw new HttpError(404, 'Question not found');
    const attemptCount = await this.attemptRepository.countByExamId(question.exam_id);
    if (attemptCount > 0) {
      throw new HttpError(409, 'Cannot modify questions of an exam that has attempts');
    }
    await this.questionRepository.delete(id);
  }

  private validateQuestionData(data: QuestionInputDTO): void {
    if (!data.statement?.trim()) throw new HttpError(400, 'Question statement is required');
    if (data.points !== undefined && data.points < 1) {
      throw new HttpError(400, 'Points must be at least 1');
    }
    if (!data.choices || data.choices.length < 2 || data.choices.length > 6) {
      throw new HttpError(400, 'A question must have between 2 and 6 choices');
    }
    if (data.choices.some(c => !c.text?.trim())) {
      throw new HttpError(400, 'Choice text is required');
    }
    const correctCount = data.choices.filter(c => c.is_correct).length;
    if (correctCount !== 1) {
      throw new HttpError(400, 'A question must have exactly one correct choice');
    }
  }
}