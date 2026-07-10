package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {

    List<PracticeSession> findByUser_IdOrderByStartedAtDesc(UUID userId);
}
