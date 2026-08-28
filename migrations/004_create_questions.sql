CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    statement TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 1),
    position INTEGER NOT NULL DEFAULT 1,
    exam_id INTEGER NOT NULL,
    CONSTRAINT fk_questions_exams
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE
);