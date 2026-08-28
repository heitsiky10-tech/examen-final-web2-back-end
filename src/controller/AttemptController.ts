import { Express, Request, Response } from 'express';
import { AttemptService } from '../services/AttemptService';
import { authenticate, authorize } from '../security/AuthMiddleware';
import { HttpError } from '../security/HttpError';

const parseId = (req: Request): number => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export class AttemptController {
  private attemptService: AttemptService;

  constructor(app: Express) {
    this.attemptService = new AttemptService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    const studentOnly = authorize('student');

    app.get('/api/my/exams', authenticate, studentOnly, (req, res) => this.getAvailableExams(req, res));
    app.get('/api/my/exams/:id', authenticate, studentOnly, (req, res) => this.getExamForStudent(req, res));
    app.post('/api/my/exams/:id/submit', authenticate, studentOnly, (req, res) => this.submitExam(req, res));
    app.get('/api/my/results', authenticate, studentOnly, (req, res) => this.getMyResults(req, res));
  }

  private async getAvailableExams(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.id;
      const exams = await this.attemptService.getAvailableExams(userId);
      res.status(200).json(exams);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getExamForStudent(req: Request, res: Response): Promise<void> {
    try {
      const examId = parseId(req);
      const userId = req.authUser!.id;
      const exam = await this.attemptService.getExamForStudent(userId, examId);
      res.status(200).json(exam);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async submitExam(req: Request, res: Response): Promise<void> {
    try {
      const examId = parseId(req);
      const userId = req.authUser!.id;
      const answers = req.body.answers;
      const result = await this.attemptService.submitExam(userId, examId, answers);
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getMyResults(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.id;
      const history = await this.attemptService.getStudentHistory(userId);
      res.status(200).json(history);
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