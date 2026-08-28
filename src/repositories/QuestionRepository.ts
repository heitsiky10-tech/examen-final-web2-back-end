import pool from '../configurations/connection';
import { Choice } from '../models/Choice';
import { Question, QuestionInputDTO } from '../models/Question';

const QUESTION_COLUMNS = `q.id, q.exam_id, q.statement, q.points, q.position`;

export class QuestionRepository {
  async findByExamId(examId: number): Promise<Question[]> {
    const query = `
      SELECT ${QUESTION_COLUMNS},
             c.id as choice_id, c.text as choice_text, c.is_correct as choice_is_correct
      FROM questions q
      LEFT JOIN choices c ON c.question_id = q.id
      WHERE q.exam_id = $1
      ORDER BY q.position ASC, q.id ASC, c.id ASC
    `;
    const result = await pool.query(query, [examId]);
    return this.mapRowsToQuestions(result.rows);
  }

  async findById(id: number): Promise<Question | null> {
    const query = `
      SELECT ${QUESTION_COLUMNS},
             c.id as choice_id, c.text as choice_text, c.is_correct as choice_is_correct
      FROM questions q
      LEFT JOIN choices c ON c.question_id = q.id
      WHERE q.id = $1
      ORDER BY c.id ASC
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowsToQuestions(result.rows)[0] ?? null;
  }

  async create(examId: number, data: QuestionInputDTO): Promise<Question> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const questionResult = await client.query(
        `INSERT INTO questions (exam_id, statement, points, position)
         VALUES ($1, $2, $3, $4)
         RETURNING id, exam_id, statement, points, position`,
        [examId, data.statement, data.points ?? 1, data.position ?? 1]
      );
      const question = questionResult.rows[0];

      const choices: Choice[] = [];
      for (const choice of data.choices) {
        const choiceResult = await client.query(
          `INSERT INTO choices (question_id, text, is_correct)
           VALUES ($1, $2, $3)
           RETURNING id, question_id, text, is_correct`,
          [question.id, choice.text, choice.is_correct]
        );
        choices.push(choiceResult.rows[0]);
      }

      await client.query('COMMIT');
      return { ...question, choices };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: QuestionInputDTO): Promise<Question | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const questionResult = await client.query(
        `UPDATE questions
         SET statement = $1, points = $2, position = $3
         WHERE id = $4
         RETURNING id, exam_id, statement, points, position`,
        [data.statement, data.points ?? 1, data.position ?? 1, id]
      );
      if (questionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const question = questionResult.rows[0];

      await client.query('DELETE FROM choices WHERE question_id = $1', [id]);

      const choices: Choice[] = [];
      for (const choice of data.choices) {
        const choiceResult = await client.query(
          `INSERT INTO choices (question_id, text, is_correct)
           VALUES ($1, $2, $3)
           RETURNING id, question_id, text, is_correct`,
          [id, choice.text, choice.is_correct]
        );
        choices.push(choiceResult.rows[0]);
      }

      await client.query('COMMIT');
      return { ...question, choices };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  private mapRowsToQuestions(rows: any[]): Question[] {
    const map = new Map<number, Question>();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          exam_id: row.exam_id,
          statement: row.statement,
          points: row.points,
          position: row.position,
          choices: []
        });
      }
      if (row.choice_id) {
        map.get(row.id)!.choices.push({
          id: row.choice_id,
          text: row.choice_text,
          is_correct: row.choice_is_correct,
          question_id: row.id
        });
      }
    }
    return Array.from(map.values());
  }
}