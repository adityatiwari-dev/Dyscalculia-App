package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.UserAchievement;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.UserAchievementRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import com.numberbuddies.phase2.service.AchievementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/achievements")
public class AchievementController {

    private final UserProfileRepository userProfileRepository;
    private final UserAchievementRepository achievementRepository;
    private final AchievementService achievementService;

    public AchievementController(
            UserProfileRepository userProfileRepository,
            UserAchievementRepository achievementRepository,
            AchievementService achievementService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.achievementRepository = achievementRepository;
        this.achievementService = achievementService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAchievements(@RequestParam String externalUserId) {
        UserProfile user = userProfileRepository.findByExternalUserId(externalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));

        // Evaluate and award achievements in real-time
        achievementService.evaluateAndAwardAchievements(user);

        List<UserAchievement> earned = achievementRepository.findByUser_IdOrderByEarnedAtDesc(user.getId());
        List<String> earnedKeys = earned.stream().map(UserAchievement::getAchievementKey).collect(Collectors.toList());

        // Define system achievements list
        List<Map<String, Object>> systemAchievements = List.of(
            Map.of(
                "key", "FIRST_STEPS",
                "title", "First Steps Badge",
                "description", "Completed your first diagnostic assessment test.",
                "icon", "🌟",
                "earned", earnedKeys.contains("FIRST_STEPS")
            ),
            Map.of(
                "key", "PRACTICE_CHAMPION",
                "title", "Practice Champion",
                "description", "Finished at least 3 custom practice target exercises.",
                "icon", "🏆",
                "earned", earnedKeys.contains("PRACTICE_CHAMPION")
            ),
            Map.of(
                "key", "MASTERY_BADGE",
                "title", "Concept Mastery Badge",
                "description", "Achieved an accuracy of 85% or higher on an assessment.",
                "icon", "⚡",
                "earned", earnedKeys.contains("MASTERY_BADGE")
            ),
            Map.of(
                "key", "SPEED_RUNNER",
                "title", "Speed Runner Badge",
                "description", "Answered questions with an average speed under 4 seconds.",
                "icon", "🏎️",
                "earned", earnedKeys.contains("SPEED_RUNNER")
            )
        );

        return ResponseEntity.ok(systemAchievements);
    }
}
