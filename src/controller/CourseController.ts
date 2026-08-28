import { Express, Request, Response } from 'express';
import { CourseService } from '../services/CourseService';
import { authenticate, authorize } from '../security/AuthMiddleware';
import { HttpError } from '../security/HttpError';

const parseId = (req: Request): number => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export class CourseController {
  private courseService: CourseService;

  constructor(app: Express) {
    this.courseService = new CourseService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    const adminOnly = authorize('admin');

    app.get('/api/courses', authenticate, adminOnly, (req, res) => this.getAll(req, res));
    app.post('/api/courses', authenticate, adminOnly, (req, res) => this.create(req, res));
    app.put('/api/courses/:id', authenticate, adminOnly, (req, res) => this.update(req, res));
    app.delete('/api/courses/:id', authenticate, adminOnly, (req, res) => this.delete(req, res));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    try {
      const courses = await this.courseService.getAllCourses();
      res.status(200).json(courses);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const course = await this.courseService.updateCourse(id, req.body);
      res.status(200).json(course);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const course = await this.courseService.deleteCourse(id);
      res.status(200).json(course); // 200 avec le cours supprimé, pas 204 (cf. OpenAPI)
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