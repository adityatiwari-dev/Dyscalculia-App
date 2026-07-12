package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.PracticeSession;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.PracticeSessionRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/learning-path")
public class LearningPathController {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final QuestionResultRepository questionResultRepository;
    private final PracticeSessionRepository practiceSessionRepository;

    public LearningPathController(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            QuestionResultRepository questionResultRepository,
            PracticeSessionRepository practiceSessionRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.questionResultRepository = questionResultRepository;
        this.practiceSessionRepository = practiceSessionRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLearningPath(@RequestParam String externalUserId) {
        UserProfile user = userProfileRepository.findByExternalUserId(externalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));

        List<AssessmentRecord> assessments = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        List<QuestionResult> questionResults = questionResultRepository.findByAssessment_User_Id(user.getId());
        List<PracticeSession> practices = practiceSessionRepository.findByUser_IdOrderByStartedAtDesc(user.getId());

        List<Map<String, Object>> path = new ArrayList<>();

        // Node 1: Completed Assessment
        Map<String, Object> node1 = new HashMap<>();
        node1.put("title", "Assessment Complete");
        node1.put("status", assessments.isEmpty() ? "ACTIVE" : "COMPLETED");
        node1.put("description", assessments.isEmpty() ? "Complete your first diagnostic test to map your concept strengths." : "Completed diagnostic screening on " + assessments.get(0).getCompletedAt().toLocalDate());
        node1.put("actionLink", "/screening");
        path.add(node1);

        // Node 2: Weak Topics Identification
        Map<String, Object> node2 = new HashMap<>();
        node2.put("title", "Weak Areas Identified");
        node2.put("actionLink", null);
        
        List<String> weakTopics = new ArrayList<>();
        if (!questionResults.isEmpty()) {
            Map<WeakTopic, List<QuestionResult>> grouped = questionResults.stream()
                    .filter(q -> q.getTopic() != null)
                    .collect(Collectors.groupingBy(QuestionResult::getTopic));
            for (Map.Entry<WeakTopic, List<QuestionResult>> entry : grouped.entrySet()) {
                long total = entry.getValue().size();
                long correct = entry.getValue().stream().filter(QuestionResult::isCorrect).count();
                double acc = total == 0 ? 0.0 : (correct * 100.0 / total);
                if (acc < 70.0) {
                    weakTopics.add(entry.getKey().name().toLowerCase().replace('_', ' '));
                }
            }
        }

        if (assessments.isEmpty()) {
            node2.put("status", "LOCKED");
            node2.put("description", "Complete assessment to identify focus areas.");
        } else if (weakTopics.isEmpty()) {
            node2.put("status", "COMPLETED");
            node2.put("description", "Great job! No critical weak areas identified.");
        } else {
            node2.put("status", "COMPLETED");
            node2.put("description", "Identified focus zones: " + String.join(", ", weakTopics));
        }
        path.add(node2);

        // Node 3: Recommended Practice
        Map<String, Object> node3 = new HashMap<>();
        node3.put("title", "Targeted Practice");
        node3.put("actionLink", "/practice");

        if (assessments.isEmpty()) {
            node3.put("status", "LOCKED");
            node3.put("description", "Unlock practice after taking assessment.");
        } else {
            long completedPractices = practices.size();
            node3.put("status", completedPractices >= 2 ? "COMPLETED" : "ACTIVE");
            node3.put("description", "Practice recommendations are live. Completed " + completedPractices + "/2 target topics.");
        }
        path.add(node3);

        // Node 4: Mini Assessment (requires at least 2 completed practice sessions)
        Map<String, Object> node4 = new HashMap<>();
        node4.put("title", "Mini Assessment");
        node4.put("actionLink", "/screening");

        if (practices.size() < 2) {
            node4.put("status", "LOCKED");
            node4.put("description", "Complete at least 2 practice sessions to unlock this checkout quiz.");
        } else {
            boolean hasReviewAcc = assessments.size() > 1;
            node4.put("status", hasReviewAcc ? "COMPLETED" : "ACTIVE");
            node4.put("description", hasReviewAcc ? "Mini Assessment completed." : "Quiz unlocked! Take a mini checkout assessment to verify topic mastery.");
        }
        path.add(node4);

        // Node 5: Improvement
        Map<String, Object> node5 = new HashMap<>();
        node5.put("title", "Concept Mastery");
        node5.put("actionLink", "/progress");

        if (assessments.size() <= 1) {
            node5.put("status", "LOCKED");
            node5.put("description", "Unlock mastery tracking by finishing the mini assessment.");
        } else {
            node5.put("status", "COMPLETED");
            node5.put("description", "Compare your screening results in the Progress Dashboard.");
        }
        path.add(node5);

        return ResponseEntity.ok(path);
    }
}
