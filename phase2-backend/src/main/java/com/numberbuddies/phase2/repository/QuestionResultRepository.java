package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.QuestionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuestionResultRepository extends JpaRepository<QuestionResult, UUID> {

    List<QuestionResult> findByAssessment_IdOrderBySequenceNumberAsc(UUID assessmentId);

    List<QuestionResult> findByAssessment_User_Id(UUID userId);
}
