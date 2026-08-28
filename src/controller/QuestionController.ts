import { Express, Request, Response } from 'express';
import { QuestionService } from '../services/QuestionService';
import { authenticate, authorize } from '../security/AuthMiddleware';
import { HttpError } from '../security/HttpError';

const parseId = (req: Request, param = 'id'): number => {
  const id = parseInt(req.params[param] as string, 10);
  if (Number.isNaN(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export class QuestionController {
  private questionService: QuestionService;

  constructor(app: Express) {
    this.questionService = new QuestionService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    const adminOnly = authorize('admin');

    app.get('/api/exams/:id/questions', authenticate, adminOnly, (req, res) => this.getByExam(req, res));
    app.post('/api/exams/:id/questions', authenticate, adminOnly, (req, res) => this.create(req, res));
    app.put('/api/questions/:id', authenticate, adminOnly, (req, res) => this.update(req, res));
    app.delete('/api/questions/:id', authenticate, adminOnly, (req, res) => this.delete(req, res));
  }

  private async getByExam(req: Request, res: Response): Promise<void> {
    try {
      const examId = parseId(req);
      const questions = await this.questionService.getQuestionsByExamId(examId);
      res.status(200).json(questions);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const examId = parseId(req);
      const question = await this.questionService.createQuestion(examId, req.body);
      res.status(201).json(question);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const question = await this.questionService.updateQuestion(id, req.body);
      res.status(200).json(question);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      await this.questionService.deleteQuestion(id);
      res.status(200).json({ message: 'Question deleted' });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(status).json({ message });
  }
}