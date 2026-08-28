import { AttemptRepository } from '../repositories/AttemptRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { ExamRepository } from '../repositories/ExamRepository';
import { AnswerSubmissionDTO } from '../models/Attempt';
import { HttpError } from '../security/HttpError';
import pool from '../configurations/connection';

export class AttemptService {
  private attemptRepository: AttemptRepository;
  private questionRepository: QuestionRepository;
  private examRepository: ExamRepository;

  constructor() {
    this.attemptRepository = new AttemptRepository();
    this.questionRepository = new QuestionRepository();
    this.examRepository = new ExamRepository();
  }

  async getAvailableExams(userId: number) {
    return this.examRepository.findAvailableForStudent(userId);
  }

  async getExamForStudent(userId: number, examId: number) {
    const exam = await this.examRepository.findByIdWithDetails(examId);
    if (!exam) throw new HttpError(404, 'Exam not found');

    const now = new Date();
    if (now < new Date(exam.starts_at as any) || now > new Date(exam.ends_at as any)) {
      throw new HttpError(403, 'Exam is not available');
    }

    const existingAttempt = await this.attemptRepository.findByUserAndExam(userId, examId);
    if (existingAttempt) throw new HttpError(409, 'Exam already taken');

    const questions = await this.questionRepository.findByExamId(examId);
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      course: exam.course,
      ends_at: exam.ends_at,
      question_count: questions.length,
      total_points: totalPoints,
      questions: questions.map(q => ({
        id: q.id,
        statement: q.statement,
        points: q.points,
        position: q.position,
        choices: q.choices.map(c => ({ id: c.id, text: c.text }))
      }))
    };
  }

  async submitExam(userId: number, examId: number, answers: AnswerSubmissionDTO[]) {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new HttpError(404, 'Exam not found');

    const now = new Date();
    if (now < new Date(exam.starts_at) || now > new Date(exam.ends_at)) {
      throw new HttpError(403, 'Exam is not available');
    }

    const existingAttempt = await this.attemptRepository.findByUserAndExam(userId, examId);
    if (existingAttempt) throw new HttpError(409, 'Exam already taken');

    if (!Array.isArray(answers)) {
      throw new HttpError(400, 'answers must be an array');
    }

    const questions = await this.questionRepository.findByExamId(examId);
    const questionIds = new Set(questions.map(q => q.id));
    const seenQuestionIds = new Set<number>();

    for (const answer of answers) {
      if (!answer || typeof answer.question_id !== 'number' || typeof answer.choice_id !== 'number') {
        throw new HttpError(400, 'Each answer must have a question_id and a choice_id');
      }
      if (seenQuestionIds.has(answer.question_id)) {
        throw new HttpError(400, 'Duplicate question_id in answers');
      }
      seenQuestionIds.add(answer.question_id);

      if (!questionIds.has(answer.question_id)) {
        throw new HttpError(400, 'question_id does not belong to this exam');
      }

      const question = questions.find(q => q.id === answer.question_id)!;
      const choiceBelongs = question.choices.some(c => c.id === answer.choice_id);
      if (!choiceBelongs) {
        throw new HttpError(400, 'choice_id does not belong to the given question');
      }
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const answerMap = new Map(answers.map(a => [a.question_id, a.choice_id]));

    let totalScore = 0;
    for (const question of questions) {
      const selectedChoiceId = answerMap.get(question.id);
      if (selectedChoiceId === undefined) continue;
      const correctChoice = question.choices.find(c => c.is_correct);
      if (correctChoice && correctChoice.id === selectedChoiceId) {
        totalScore += question.points;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const attempt = await this.attemptRepository.create(userId, examId, totalScore, client);
      for (const answer of answers) {
        await this.attemptRepository.createStudentAnswer(attempt.id, answer.question_id, answer.choice_id, client);
      }

      await client.query('COMMIT');

      return {
        score: totalScore,
        total_points: totalPoints,
        correction: questions.map(q => {
          const studentChoiceId = answerMap.get(q.id) ?? null;
          const correctChoice = q.choices.find(c => c.is_correct);
          const correctChoiceId = correctChoice ? correctChoice.id : null;

          return {
            question_id: q.id,
            statement: q.statement,
            points: q.points,
            student_choice_id: studentChoiceId,
            correct_choice_id: correctChoiceId,
            is_correct: studentChoiceId !== null && studentChoiceId === correctChoiceId
          };
        })
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStudentHistory(userId: number) {
    return this.attemptRepository.findHistoryByUserId(userId);
  }

  async getExamResultsForAdmin(examId: number) {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new HttpError(404, 'Exam not found');

    const questions = await this.questionRepository.findByExamId(examId);
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const results = await this.attemptRepository.findResultsByExamId(examId);
    const attemptCount = results.length;
    const average = attemptCount > 0
      ? Math.round((results.reduce((sum, r) => sum + r.score, 0) / attemptCount) * 100) / 100
      : null;

    return {
      exam: { id: exam.id, title: exam.title },
      total_points: totalPoints,
      average,
      attempt_count: attemptCount,
      results
    };
  }
}