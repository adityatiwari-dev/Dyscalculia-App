-- V8: Create assessment_questions table and seed initial questions for the Question Bank
CREATE TABLE assessment_questions (
    id BINARY(16) PRIMARY KEY,
    topic ENUM('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') NOT NULL,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options JSON NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Easy Questions
INSERT INTO assessment_questions (id, topic, difficulty, question_type, question_text, options, correct_answer) VALUES
(UUID_TO_BIN(UUID()), 'ADDITION', 'EASY', 'arithmetic', '2 + 3 = ?', '["4", "5", "6", "7"]', '5'),
(UUID_TO_BIN(UUID()), 'ADDITION', 'EASY', 'arithmetic', '4 + 1 = ?', '["3", "4", "5", "6"]', '5'),
(UUID_TO_BIN(UUID()), 'SUBTRACTION', 'EASY', 'arithmetic', '5 - 2 = ?', '["2", "3", "4", "5"]', '3'),
(UUID_TO_BIN(UUID()), 'COMPARISON', 'EASY', 'comparison', 'Which is larger: 4 or 7?', '["4", "7", "Equal", "None"]', '7'),
(UUID_TO_BIN(UUID()), 'NUMBER_SENSE', 'EASY', 'count_dots', 'How many dots: ● ● ● ●?', '["3", "4", "5", "6"]', '4');

-- Seed Initial Medium Questions
INSERT INTO assessment_questions (id, topic, difficulty, question_type, question_text, options, correct_answer) VALUES
(UUID_TO_BIN(UUID()), 'ADDITION', 'MEDIUM', 'arithmetic', '12 + 7 = ?', '["18", "19", "20", "21"]', '19'),
(UUID_TO_BIN(UUID()), 'SUBTRACTION', 'MEDIUM', 'arithmetic', '15 - 8 = ?', '["6", "7", "8", "9"]', '7'),
(UUID_TO_BIN(UUID()), 'COMPARISON', 'MEDIUM', 'comparison', 'Is 25 greater than 32?', '["Yes", "No", "Equal", "Not Sure"]', 'No'),
(UUID_TO_BIN(UUID()), 'PLACE_VALUE', 'MEDIUM', 'place_value', 'In the number 84, what place value is 8?', '["Ones", "Tens", "Hundreds", "Thousands"]', 'Tens'),
(UUID_TO_BIN(UUID()), 'PATTERN_RECOGNITION', 'MEDIUM', 'pattern', 'What number comes next: 2, 4, 6, 8, ?', '["9", "10", "11", "12"]', '10');

-- Seed Initial Hard Questions
INSERT INTO assessment_questions (id, topic, difficulty, question_type, question_text, options, correct_answer) VALUES
(UUID_TO_BIN(UUID()), 'MULTIPLICATION', 'HARD', 'arithmetic', '6 * 7 = ?', '["40", "41", "42", "43"]', '42'),
(UUID_TO_BIN(UUID()), 'DIVISION', 'HARD', 'arithmetic', '45 / 9 = ?', '["4", "5", "6", "7"]', '5'),
(UUID_TO_BIN(UUID()), 'PLACE_VALUE', 'HARD', 'place_value', 'In 452, what is the value of 4?', '["4", "40", "400", "450"]', '400'),
(UUID_TO_BIN(UUID()), 'PATTERN_RECOGNITION', 'HARD', 'pattern', 'What number comes next: 1, 3, 9, 27, ?', '["54", "72", "81", "90"]', '81'),
(UUID_TO_BIN(UUID()), 'COMPARISON', 'HARD', 'comparison', 'Which statement is true?', '["45 > 54", "54 < 45", "45 = 54", "54 > 45"]', '54 > 45');
