package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.enums.WeakTopic;
import org.springframework.stereotype.Component;

/**
 * Maps existing Phase 1 question metadata to educational weak-area topics.
 * Used for history storage and future AI recommendations — not medical diagnosis.
 */
@Component
public class TopicMapperService {

    public WeakTopic map(String questionType, String questionText, String subtype) {
        String type = safeLower(questionType);
        String text = safeLower(questionText);
        String sub = safeLower(subtype);

        if ("symbol_quantity".equals(sub) || text.contains("numeral") || text.contains("place")) {
            return WeakTopic.PLACE_VALUE;
        }

        if ("memory".equals(type)) {
            return WeakTopic.PATTERN_RECOGNITION;
        }

        if ("arithmetic".equals(type)) {
            if (text.contains("×") || text.contains("*") || text.toLowerCase().contains("multiply")) {
                return WeakTopic.MULTIPLICATION;
            }
            if (text.contains("÷") || text.contains("/") || text.toLowerCase().contains("divide")) {
                return WeakTopic.DIVISION;
            }
            if (text.contains("-")) {
                return WeakTopic.SUBTRACTION;
            }
            return WeakTopic.ADDITION;
        }

        if ("number_sense".equals(type)) {
            if (text.contains("?") && (text.contains(">") || text.contains("<") || text.contains("="))) {
                return WeakTopic.COMPARISON;
            }
            if (text.contains("missing") || text.contains("? =") || text.contains(", ?,")) {
                return WeakTopic.PATTERN_RECOGNITION;
            }
            if (text.contains("how many") || text.contains("dots")) {
                return WeakTopic.NUMBER_SENSE;
            }
            return WeakTopic.NUMBER_SENSE;
        }

        if ("spatial".equals(type)) {
            if (text.contains("how many") || text.contains("count")) {
                return WeakTopic.NUMBER_SENSE;
            }
            return WeakTopic.COMPARISON;
        }

        if (text.contains("+")) {
            return WeakTopic.ADDITION;
        }
        if (text.contains("-")) {
            return WeakTopic.SUBTRACTION;
        }
        if (text.contains("×") || text.contains("*")) {
            return WeakTopic.MULTIPLICATION;
        }
        if (text.contains("÷") || text.contains("/")) {
            return WeakTopic.DIVISION;
        }

        return WeakTopic.NUMBER_SENSE;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}
