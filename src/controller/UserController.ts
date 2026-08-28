import { Express, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { authenticate, authorize } from '../security/AuthMiddleware';
import { HttpError } from '../security/HttpError';

const parseId = (req: Request): number => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export class UserController {
  private userService: UserService;
  constructor(app: Express) {
    this.userService = new UserService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    const adminOnly = authorize('admin');
    app.get('/api/students', authenticate, adminOnly, (req, res) => this.getAll(req, res));
    app.post('/api/students', authenticate, adminOnly, (req, res) => this.create(req, res));
    app.put('/api/students/:id', authenticate, adminOnly, (req, res) => this.update(req, res));
    app.delete('/api/students/:id', authenticate, adminOnly, (req, res) => this.delete(req, res));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    try {
      const students = await this.userService.getAllStudents();
      res.status(200).json(students);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const student = await this.userService.createStudent({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      res.status(201).json(student);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const student = await this.userService.updateStudent(
        id,
        req.body.name,
        req.body.email,
        req.body.is_active,
        req.body.password
      );
      res.status(200).json(student);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req);
      const student = await this.userService.deactivateStudent(id);
      res.status(200).json(student); // 200 avec l'étudiant désactivé, pas 204
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