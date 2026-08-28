import { Express, Request, Response } from 'express';
import { ExamService } from '../services/ExamService';
import { AttemptService } from '../services/AttemptService';
import { authenticate, authorize } from '../security/AuthMiddleware';
import { HttpError } from '../security/HttpError';

const parseId= (req: Request): number => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export class ExamController {
  private examService: ExamService;
  private attemptService: AttemptService;

  constructor(app: Express) {
    this.examService = new ExamService();
    this.attemptService = new AttemptService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    const adminOnly = authorize('admin');

    app.get('/api/exams', authenticate, adminOnly, (req, res) => this.getAll(req, res));
    app.get('/api/exams/:id', authenticate, adminOnly, (req, res) => this.getById(req, res));
    app.post('/api/exams', authenticate, adminOnly, (req, res) => this.create(req, res));
    app.put('/api/exams/:id', authenticate, adminOnly, (req, res) => this.update(req, res));
    app.delete('/api/exams/:id', authenticate, adminOnly, (req, res) => this.delete(req, res));
    app.get('/api/exams/:id/results', authenticate, adminOnly, (req, res) => this.getResults(req, res));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    try {
      const exams = await this.examService.getAllExams();
      res.status(200).json(exams);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const exam = await this.examService.getExamById(id);
      res.status(200).json(exam);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const exam = await this.examService.createExam(req.body);
      res.status(201).json(exam);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const exam = await this.examService.updateExam(id, req.body);
      res.status(200).json(exam);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      await this.examService.deleteExam(id);
      res.status(200).json({ message: 'Exam deleted' });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getResults(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const results = await this.attemptService.getExamResultsForAdmin(id);
      res.status(200).json(results);
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