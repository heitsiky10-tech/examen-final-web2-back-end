import { Express, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { HttpError } from '../security/HttpError';

export class AuthController {
  private authService: AuthService;

  constructor(app: Express) {
    this.authService = new AuthService();
    this.setupRoutes(app);
  }

  private setupRoutes(app: Express): void {
    app.post('/api/auth/login', (req, res) => this.login(req, res));
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
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