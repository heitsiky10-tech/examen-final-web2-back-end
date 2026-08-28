CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY, 
    user_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0, 
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT fk_attempts_users 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_attempts_exams 
        FOREIGN KEY (exam_id) 
        REFERENCES exams(id) 
        ON DELETE RESTRICT,
    CONSTRAINT uq_attempts_user_exam UNIQUE (user_id, exam_id)
);