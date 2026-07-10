package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.PracticeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PracticeQuestionRepository extends JpaRepository<PracticeQuestion, UUID> {

    List<PracticeQuestion> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    List<PracticeQuestion> findBySession_IdOrderByCreatedAtAsc(UUID sessionId);
}
