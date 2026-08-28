import pool from '../configurations/connection';
import { Exam, ExamInputDTO, ExamWithDetails } from '../models/Exam';

const DETAILS_SELECT = `
  SELECT e.id, e.title, e.description, e.starts_at, e.ends_at,
         json_build_object('id', c.id, 'code', c.unique_code, 'name', c.name) as course,
         COUNT(DISTINCT q.id)::int as question_count,
         COUNT(DISTINCT a.id)::int as attempt_count
  FROM exams e
  JOIN courses c ON c.id = e.course_id
  LEFT JOIN questions q ON q.exam_id = e.id
  LEFT JOIN attempts a ON a.exam_id = e.id
`;

export class ExamRepository {
  async findAll(): Promise<ExamWithDetails[]> {
    const result = await pool.query(`${DETAILS_SELECT} GROUP BY e.id, c.id ORDER BY e.id ASC`);
    return result.rows;
  }

  async findByIdWithDetails(id: number): Promise<ExamWithDetails | null> {
    const result = await pool.query(`${DETAILS_SELECT} WHERE e.id = $1 GROUP BY e.id, c.id`, [id]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<Exam | null> {
    const result = await pool.query<Exam>(
      `SELECT id, course_id, title, description, starts_at, ends_at, created_at, updated_at
       FROM exams WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAvailableForStudent(userId: number) {
    const query = `
      SELECT e.id, e.title, e.description, e.ends_at,
             json_build_object('code', c.unique_code, 'name', c.name) as course,
             COUNT(q.id)::int as question_count,
             COALESCE(SUM(q.points), 0)::int as total_points
      FROM exams e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN questions q ON q.exam_id = e.id
      WHERE NOW() BETWEEN e.starts_at AND e.ends_at
        AND NOT EXISTS (SELECT 1 FROM attempts a WHERE a.exam_id = e.id AND a.user_id = $1)
      GROUP BY e.id, c.id
      ORDER BY e.starts_at ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async create(data: ExamInputDTO): Promise<Exam> {
    const result = await pool.query<Exam>(
      `INSERT INTO exams (course_id, title, description, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, course_id, title, description, starts_at, ends_at, created_at, updated_at`,
      [data.course_id, data.title, data.description ?? null, data.starts_at, data.ends_at]
    );
    return result.rows[0];
  }

  async update(id: number, data: ExamInputDTO): Promise<Exam | null> {
    const result = await pool.query<Exam>(
      `UPDATE exams
       SET course_id = $1, title = $2, description = $3, starts_at = $4, ends_at = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, course_id, title, description, starts_at, ends_at, created_at, updated_at`,
      [data.course_id, data.title, data.description ?? null, data.starts_at, data.ends_at, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM exams WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}