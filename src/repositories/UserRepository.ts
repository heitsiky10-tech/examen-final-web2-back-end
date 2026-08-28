import pool from '../configurations/connection';
import { User, Student, CreateUserDTO } from '../models/User';

const STUDENT_COLUMNS = 'id, name, email, is_active, created_at';
const AUTH_COLUMNS = 'id, name, email, role, is_active, password_hash';

export class UserRepository {
  async findAll(): Promise<Student[]> {
    const result = await pool.query<Student>(
      `SELECT ${STUDENT_COLUMNS} FROM users WHERE role = 'student' ORDER BY id ASC`
    );
    return result.rows;
  }

  async findById(id: number): Promise<Student | null> {
    const result = await pool.query<Student>(
      `SELECT ${STUDENT_COLUMNS} FROM users WHERE id = $1 AND role = 'student'`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT ${AUTH_COLUMNS} FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateUserDTO): Promise<Student> {
    const result = await pool.query<Student>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${STUDENT_COLUMNS}`,
      [data.name, data.email, data.password_hash, data.role]
    );
    return result.rows[0];
  }

  async update(id: number, name: string, email: string, is_active?: boolean): Promise<Student | null> {
    const result = await pool.query<Student>(
      `UPDATE users
       SET name = $1, email = $2, is_active = COALESCE($3, is_active), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND role = 'student'
       RETURNING ${STUDENT_COLUMNS}`,
      [name, email, is_active ?? null, id]
    );
    return result.rows[0] || null;
  }

  async updatePassword(id: number, password_hash: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = 'student'`,
      [password_hash, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deactivate(id: number): Promise<Student | null> {
    const result = await pool.query<Student>(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'student'
       RETURNING ${STUDENT_COLUMNS}`,
      [id]
    );
    return result.rows[0] || null;
  }
}