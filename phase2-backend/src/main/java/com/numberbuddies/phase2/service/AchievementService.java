package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.PracticeSession;
import com.numberbuddies.phase2.domain.entity.UserAchievement;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.PracticeSessionRepository;
import com.numberbuddies.phase2.repository.UserAchievementRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AchievementService {

    private final UserAchievementRepository achievementRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final PracticeSessionRepository practiceSessionRepository;

    public AchievementService(
            UserAchievementRepository achievementRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            PracticeSessionRepository practiceSessionRepository
    ) {
        this.achievementRepository = achievementRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.practiceSessionRepository = practiceSessionRepository;
    }

    public List<UserAchievement> evaluateAndAwardAchievements(UserProfile user) {
        List<UserAchievement> newlyAwarded = new ArrayList<>();

        List<AssessmentRecord> assessments = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        List<PracticeSession> practices = practiceSessionRepository.findByUser_IdOrderByStartedAtDesc(user.getId());

        // 1. FIRST_STEPS: Completed at least 1 assessment
        if (!assessments.isEmpty() && !achievementRepository.existsByUser_IdAndAchievementKey(user.getId(), "FIRST_STEPS")) {
            UserAchievement ua = new UserAchievement();
            ua.setUser(user);
            ua.setAchievementKey("FIRST_STEPS");
            newlyAwarded.add(achievementRepository.save(ua));
        }

        // 2. PRACTICE_CHAMPION: Completed at least 3 practice sessions
        if (practices.size() >= 3 && !achievementRepository.existsByUser_IdAndAchievementKey(user.getId(), "PRACTICE_CHAMPION")) {
            UserAchievement ua = new UserAchievement();
            ua.setUser(user);
            ua.setAchievementKey("PRACTICE_CHAMPION");
            newlyAwarded.add(achievementRepository.save(ua));
        }

        // 3. MASTERY_BADGE: Scored 85% or above on any assessment
        boolean hasMastery = assessments.stream().anyMatch(a -> a.getAccuracy().compareTo(new BigDecimal("85.00")) >= 0);
        if (hasMastery && !achievementRepository.existsByUser_IdAndAchievementKey(user.getId(), "MASTERY_BADGE")) {
            UserAchievement ua = new UserAchievement();
            ua.setUser(user);
            ua.setAchievementKey("MASTERY_BADGE");
            newlyAwarded.add(achievementRepository.save(ua));
        }

        // 4. SPEED_RUNNER: Average question response time under 4 seconds (4000ms) on any assessment
        boolean hasSpeed = assessments.stream().anyMatch(a -> {
            long totalQ = a.getQuestionResults().size();
            return totalQ > 0 && (a.getTimeTakenMs() / totalQ) < 4000L;
        });
        if (hasSpeed && !achievementRepository.existsByUser_IdAndAchievementKey(user.getId(), "SPEED_RUNNER")) {
            UserAchievement ua = new UserAchievement();
            ua.setUser(user);
            ua.setAchievementKey("SPEED_RUNNER");
            newlyAwarded.add(achievementRepository.save(ua));
        }

        return newlyAwarded;
    }
}
