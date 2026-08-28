import express, { Express } from 'express';
import dotenv from 'dotenv';
import corsMiddleware from './configurations/cors';

import { AuthController } from './controller/AuthController';
import { UserController } from './controller/UserController';
import { CourseController } from './controller/CourseController';
import { ExamController } from './controller/ExamController';
import { QuestionController } from './controller/QuestionController';
import { AttemptController } from './controller/AttemptController';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

new AuthController(app);
new UserController(app);
new CourseController(app);
new ExamController(app);
new QuestionController(app);
new AttemptController(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});