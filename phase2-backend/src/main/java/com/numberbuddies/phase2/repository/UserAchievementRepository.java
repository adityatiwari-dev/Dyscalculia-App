package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    List<UserAchievement> findByUser_IdOrderByEarnedAtDesc(UUID userId);

    List<UserAchievement> findByUser_ExternalUserIdOrderByEarnedAtDesc(String externalUserId);

    boolean existsByUser_IdAndAchievementKey(UUID userId, String achievementKey);
}
