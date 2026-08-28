import { Pool, PoolClient } from 'pg';
import pool from '../configurations/connection';
import { Attempt } from '../models/Attempt';

export class AttemptRepository {
  async create(user_id: number, exam_id: number, score: number, client: Pool | PoolClient = pool): Promise<Attempt> {
    const result = await client.query(
      `INSERT INTO attempts (user_id, exam_id, score) VALUES ($1, $2, $3)
       RETURNING id, user_id, exam_id, score, submitted_at`,
      [user_id, exam_id, score]
    );
    return result.rows[0];
  }

  async createStudentAnswer(attempt_id: number, question_id: number, choice_id: number, client: Pool | PoolClient = pool): Promise<void> {
    await client.query(
      `INSERT INTO student_answers (attempt_id, question_id, choice_id) VALUES ($1, $2, $3)`,
      [attempt_id, question_id, choice_id]
    );
  }

  async findByUserAndExam(user_id: number, exam_id: number): Promise<Attempt | null> {
    const result = await pool.query<Attempt>(
      `SELECT id, user_id, exam_id, score, submitted_at FROM attempts WHERE user_id = $1 AND exam_id = $2`,
      [user_id, exam_id]
    );
    return result.rows[0] || null;
  }

  async findHistoryByUserId(user_id: number) {
    const query = `
      SELECT a.exam_id, e.title, c.unique_code as course_code, a.score,
             COALESCE(q.total_points, 0)::int as total_points, a.submitted_at
      FROM attempts a
      JOIN exams e ON e.id = a.exam_id
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN (
        SELECT exam_id, SUM(points)::int as total_points
        FROM questions
        GROUP BY exam_id
      ) q ON q.exam_id = e.id
      WHERE a.user_id = $1
      ORDER BY a.submitted_at DESC
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  }

  async findResultsByExamId(exam_id: number) {
    const query = `
      SELECT u.id as student_id, u.name, a.score, a.submitted_at
      FROM attempts a
      JOIN users u ON u.id = a.user_id
      WHERE a.exam_id = $1
      ORDER BY a.score DESC, u.name ASC
    `;
    const result = await pool.query(query, [exam_id]);
    return result.rows;
  }

  async countByExamId(exam_id: number): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM attempts WHERE exam_id = $1',
      [exam_id]
    );
    return parseInt(result.rows[0].count, 10);
  }
}