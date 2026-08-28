CREATE TABLE IF NOT EXISTS choices (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    question_id INTEGER NOT NULL,
    CONSTRAINT fk_question
        FOREIGN KEY(question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);
CREATE UNIQUE INDEX one_correct_choice_per_question ON choices(question_id) WHERE is_correct = TRUE;