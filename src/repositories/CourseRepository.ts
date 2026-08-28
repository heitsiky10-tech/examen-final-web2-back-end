import pool from '../configurations/connection';
import { Course, CourseDTO } from '../models/Course';

const BASE_SELECT = `
  SELECT c.id, c.unique_code as code, c.name, c.description,
         COUNT(e.id)::int as exam_count,
         c.created_at, c.updated_at
  FROM courses c
  LEFT JOIN exams e ON e.course_id = c.id
`;

export class CourseRepository {
  async findAll(): Promise<Course[]> {
    const result = await pool.query(`${BASE_SELECT} GROUP BY c.id ORDER BY c.id ASC`);
    return result.rows;
  }

  async findById(id: number): Promise<Course | null> {
    const result = await pool.query(`${BASE_SELECT} WHERE c.id = $1 GROUP BY c.id`, [id]);
    return result.rows[0] || null;
  }

  async findByCode(code: string): Promise<Course | null> {
    const result = await pool.query(`${BASE_SELECT} WHERE c.unique_code = $1 GROUP BY c.id`, [code]);
    return result.rows[0] || null;
  }

  async create(data: CourseDTO): Promise<Course> {
    const result = await pool.query(
      `INSERT INTO courses (unique_code, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, unique_code as code, name, description, 0 as exam_count, created_at, updated_at`,
      [data.code, data.name, data.description ?? null]
    );
    return result.rows[0];
  }

  async update(id: number, data: CourseDTO): Promise<Course | null> {
    const result = await pool.query(
      `UPDATE courses
       SET unique_code = $1, name = $2, description = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, unique_code as code, name, description,
                 (SELECT COUNT(*)::int FROM exams WHERE course_id = $4) as exam_count,
                 created_at, updated_at`,
      [data.code, data.name, data.description ?? null, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async countExamsByCourseId(id: number): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM exams WHERE course_id = $1',
      [id]
    );
    return parseInt(result.rows[0].count, 10);
  }
}