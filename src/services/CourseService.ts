import { CourseRepository } from '../repositories/CourseRepository';
import { Course, CourseDTO } from '../models/Course';
import { HttpError } from '../security/HttpError';

export class CourseService {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }

  async getCourseById(id: number): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new HttpError(404, 'Course not found');
    return course;
  }

  async createCourse(data: CourseDTO): Promise<Course> {
    this.validateCourseData(data);

    const existing = await this.courseRepository.findByCode(data.code);
    if (existing) throw new HttpError(409, 'Course code already in use');

    return this.courseRepository.create(data);
  }

  async updateCourse(id: number, data: CourseDTO): Promise<Course> {
    this.validateCourseData(data);

    const course = await this.courseRepository.findById(id);
    if (!course) throw new HttpError(404, 'Course not found');

    if (data.code !== course.code) {
      const existing = await this.courseRepository.findByCode(data.code);
      if (existing) throw new HttpError(409, 'Course code already in use');
    }

    const updated = await this.courseRepository.update(id, data);
    if (!updated) throw new HttpError(404, 'Course not found');
    return updated;
  }

  async deleteCourse(id: number): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new HttpError(404, 'Course not found');

    // RG-09
    const examCount = await this.courseRepository.countExamsByCourseId(id);
    if (examCount > 0) throw new HttpError(409, 'Cannot delete a course that has exams');

    await this.courseRepository.delete(id);
    return course;
  }

  private validateCourseData(data: CourseDTO): void {
    if (!data.code?.trim()) throw new HttpError(400, 'Course code is required');
    if (!data.name?.trim()) throw new HttpError(400, 'Course name is required');
  }
}