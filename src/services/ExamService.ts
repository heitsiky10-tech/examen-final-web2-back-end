import { ExamRepository } from '../repositories/ExamRepository';
import { AttemptRepository } from '../repositories/AttemptRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { ExamInputDTO, ExamWithDetails } from '../models/Exam';
import { HttpError } from '../security/HttpError';

export class ExamService {
  private examRepository: ExamRepository;
  private attemptRepository: AttemptRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.examRepository = new ExamRepository();
    this.attemptRepository = new AttemptRepository();
    this.courseRepository = new CourseRepository();
  }

  async getAllExams(): Promise<ExamWithDetails[]> {
    return this.examRepository.findAll();
  }

  async getExamById(id: number): Promise<ExamWithDetails> {
    const exam = await this.examRepository.findByIdWithDetails(id);
    if (!exam) throw new HttpError(404, 'Exam not found');
    return exam;
  }

  async createExam(data: ExamInputDTO): Promise<ExamWithDetails> {
    await this.validateExamData(data);
    const created = await this.examRepository.create(data);
    return this.examRepository.findByIdWithDetails(created.id) as Promise<ExamWithDetails>;
  }

  async updateExam(id: number, data: ExamInputDTO): Promise<ExamWithDetails> {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new HttpError(404, 'Exam not found');
    await this.validateExamData(data);
    await this.examRepository.update(id, data);
    return this.examRepository.findByIdWithDetails(id) as Promise<ExamWithDetails>;
  }

  async deleteExam(id: number): Promise<void> {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new HttpError(404, 'Exam not found');
    const attemptCount = await this.attemptRepository.countByExamId(id);
    if (attemptCount > 0) throw new HttpError(409, 'Cannot delete an exam that has attempts');
    await this.examRepository.delete(id);
  }

  private async validateExamData(data: ExamInputDTO): Promise<void> {
    if (!data.title?.trim()) throw new HttpError(400, 'Title is required');
    if (!data.course_id) throw new HttpError(400, 'course_id is required');
    if (!data.starts_at || !data.ends_at) throw new HttpError(400, 'starts_at and ends_at are required');
    if (new Date(data.ends_at) <= new Date(data.starts_at)) {
      throw new HttpError(400, 'End date must be after start date');
    }

    const course = await this.courseRepository.findById(data.course_id);
    if (!course) throw new HttpError(400, 'Course not found');
  }
}