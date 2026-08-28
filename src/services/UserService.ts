import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { Student, CreateUserDTO } from '../models/User';
import { HttpError } from '../security/HttpError';

const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllStudents(): Promise<Student[]> {
    return this.userRepository.findAll();
  }

  async createStudent(data: { name: string; email: string; password: string }): Promise<Student> {
    if (!data.name?.trim()) throw new HttpError(400, 'Name is required');
    if (!data.email?.trim() || !EMAIL_PATTERN.test(data.email)) {
      throw new HttpError(400, 'Invalid email format');
    }
    if (!data.password || data.password.length < 6) {
      throw new HttpError(400, 'Password must be at least 6 characters');
    }

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) throw new HttpError(409, 'Email already in use');
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const created: CreateUserDTO = { name: data.name, email: data.email, password_hash, role: 'student' };
    return this.userRepository.create(created);
  }

  async updateStudent(id: number, name: string, email: string, is_active?: boolean, password?: string): Promise<Student> {
    if (!name?.trim()) throw new HttpError(400, 'Name is required');
    if (!email?.trim() || !EMAIL_PATTERN.test(email)) {
      throw new HttpError(400, 'Invalid email format');
    }
    const student = await this.userRepository.findById(id);
    if (!student) throw new HttpError(404, 'Student not found');
    if (email !== student.email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) throw new HttpError(409, 'Email already in use');
    }
    if (password) {
      if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      await this.userRepository.updatePassword(id, hashed);
    }
    const updated = await this.userRepository.update(id, name, email, is_active);
    if (!updated) throw new HttpError(404, 'Student not found');
    return updated;
  }

  async deactivateStudent(id: number): Promise<Student> {
    const student = await this.userRepository.findById(id);
    if (!student) throw new HttpError(404, 'Student not found');
    const deactivated = await this.userRepository.deactivate(id);
    return deactivated as Student;
  }
}