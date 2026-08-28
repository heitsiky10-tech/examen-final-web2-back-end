CREATE TABLE IF NOT EXISTS student_answers (
    id SERIAL PRIMARY KEY, 
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    choice_id INTEGER NOT NULL,
    CONSTRAINT uq_student_answers_attempt_question 
        UNIQUE (attempt_id, question_id),
    CONSTRAINT fk_student_answers_attempts
        FOREIGN KEY (attempt_id) 
        REFERENCES attempts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_questions
        FOREIGN KEY (question_id)  
        REFERENCES questions(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_student_answers_choices
        FOREIGN KEY (choice_id) 
        REFERENCES choices(id)
        ON DELETE RESTRICT
);