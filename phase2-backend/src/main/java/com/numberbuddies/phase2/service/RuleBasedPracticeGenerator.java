package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.internal.GeneratedPracticeItem;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

@Service
public class RuleBasedPracticeGenerator {

    private final Random random = new Random();

    public List<GeneratedPracticeItem> generate(WeakTopic topic, DifficultyLevel difficulty, int count) {
        List<GeneratedPracticeItem> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int attempts = 0;
        while (items.size() < count && attempts < count * 10) {
            attempts++;
            GeneratedPracticeItem item = generateOne(topic, difficulty);
            if (seen.add(item.getQuestionText())) {
                items.add(item);
            }
        }
        return items;
    }

    private GeneratedPracticeItem generateOne(WeakTopic topic, DifficultyLevel difficulty) {
        return switch (topic) {
            case ADDITION -> addition(difficulty);
            case SUBTRACTION -> subtraction(difficulty);
            case MULTIPLICATION -> multiplication(difficulty);
            case DIVISION -> division(difficulty);
            case PLACE_VALUE -> placeValue(difficulty);
            case NUMBER_SENSE -> numberSense(difficulty);
            case COMPARISON -> comparison(difficulty);
            case PATTERN_RECOGNITION -> pattern(difficulty);
        };
    }

    private GeneratedPracticeItem addition(DifficultyLevel difficulty) {
        int max = switch (difficulty) {
            case EASY -> 10;
            case MEDIUM -> 50;
            case HARD -> 100;
        };
        int a = rand(1, max);
        int b = rand(1, max);
        return build(WeakTopic.ADDITION, difficulty, a + " + " + b + " = ?", String.valueOf(a + b));
    }

    private GeneratedPracticeItem subtraction(DifficultyLevel difficulty) {
        int max = switch (difficulty) {
            case EASY -> 10;
            case MEDIUM -> 50;
            case HARD -> 100;
        };
        int a = rand(max / 2, max);
        int b = rand(1, a);
        return build(WeakTopic.SUBTRACTION, difficulty, a + " − " + b + " = ?", String.valueOf(a - b));
    }

    private GeneratedPracticeItem multiplication(DifficultyLevel difficulty) {
        int limit = switch (difficulty) {
            case EASY -> 5;
            case MEDIUM -> 10;
            case HARD -> 12;
        };
        int a = rand(1, limit);
        int b = rand(1, limit);
        return build(WeakTopic.MULTIPLICATION, difficulty, a + " × " + b + " = ?", String.valueOf(a * b));
    }

    private GeneratedPracticeItem division(DifficultyLevel difficulty) {
        int limit = switch (difficulty) {
            case EASY -> 5;
            case MEDIUM -> 10;
            case HARD -> 12;
        };
        int b = rand(2, limit);
        int quotient = rand(1, limit);
        int a = b * quotient;
        return build(WeakTopic.DIVISION, difficulty, a + " ÷ " + b + " = ?", String.valueOf(quotient));
    }

    private GeneratedPracticeItem placeValue(DifficultyLevel difficulty) {
        int number = switch (difficulty) {
            case EASY -> rand(10, 99);
            case MEDIUM -> rand(100, 999);
            case HARD -> rand(1000, 9999);
        };
        String s = String.valueOf(number);
        int pos = rand(0, s.length() - 1);
        char digit = s.charAt(pos);
        String place = placeName(pos, s.length());
        return build(
                WeakTopic.PLACE_VALUE,
                difficulty,
                "In " + number + ", what digit is in the " + place + " place?",
                String.valueOf(digit)
        );
    }

    private GeneratedPracticeItem numberSense(DifficultyLevel difficulty) {
        int count = switch (difficulty) {
            case EASY -> rand(3, 8);
            case MEDIUM -> rand(5, 15);
            case HARD -> rand(10, 25);
        };
        return build(WeakTopic.NUMBER_SENSE, difficulty, "How many dots: " + "● ".repeat(count).trim(), String.valueOf(count));
    }

    private GeneratedPracticeItem comparison(DifficultyLevel difficulty) {
        int max = switch (difficulty) {
            case EASY -> 20;
            case MEDIUM -> 100;
            case HARD -> 1000;
        };
        int a = rand(1, max);
        int b = rand(1, max);
        String correct = a > b ? ">" : (a < b ? "<" : "=");
        return build(WeakTopic.COMPARISON, difficulty, a + "  ?  " + b, correct, List.of(">", "<", "="));
    }

    private GeneratedPracticeItem pattern(DifficultyLevel difficulty) {
        int step = switch (difficulty) {
            case EASY -> rand(1, 2);
            case MEDIUM -> rand(2, 5);
            case HARD -> rand(3, 7);
        };
        int start = rand(1, 10);
        int missing = start + step * 2;
        String text = start + ", " + (start + step) + ", ?, " + (start + step * 3);
        return build(WeakTopic.PATTERN_RECOGNITION, difficulty, "Find the missing number: " + text, String.valueOf(missing));
    }

    private GeneratedPracticeItem build(
            WeakTopic topic,
            DifficultyLevel difficulty,
            String text,
            String correct
    ) {
        return build(topic, difficulty, text, correct, numericOptions(correct));
    }

    private GeneratedPracticeItem build(
            WeakTopic topic,
            DifficultyLevel difficulty,
            String text,
            String correct,
            List<String> optionPool
    ) {
        GeneratedPracticeItem item = new GeneratedPracticeItem();
        item.setTopic(topic);
        item.setDifficulty(difficulty);
        item.setQuestionText(text);
        item.setCorrectAnswer(correct);
        item.setOptions(shuffleOptions(correct, optionPool));
        return item;
    }

    private List<String> numericOptions(String correct) {
        int c = parseIntSafe(correct);
        Set<String> opts = new HashSet<>();
        opts.add(correct);
        while (opts.size() < 4) {
            int delta = rand(1, Math.max(3, Math.abs(c) / 3 + 1));
            opts.add(String.valueOf(c + (random.nextBoolean() ? delta : -delta)));
        }
        return new ArrayList<>(opts);
    }

    private List<String> shuffleOptions(String correct, List<String> pool) {
        Set<String> opts = new HashSet<>();
        opts.add(correct);
        for (String p : pool) {
            if (opts.size() >= 4) break;
            opts.add(p);
        }
        while (opts.size() < 4) {
            opts.add(String.valueOf(rand(0, 20)));
        }
        List<String> list = new ArrayList<>(opts);
        Collections.shuffle(list, random);
        return list;
    }

    private int rand(int min, int max) {
        return random.nextInt(max - min + 1) + min;
    }

    private int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private String placeName(int indexFromLeft, int length) {
        int placeFromRight = length - 1 - indexFromLeft;
        return switch (placeFromRight) {
            case 0 -> "ones";
            case 1 -> "tens";
            case 2 -> "hundreds";
            case 3 -> "thousands";
            default -> "place";
        };
    }
}
