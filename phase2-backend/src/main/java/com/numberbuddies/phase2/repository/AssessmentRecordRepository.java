package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecord, UUID> {

    List<AssessmentRecord> findByUser_IdOrderByCompletedAtDesc(UUID userId);

    Optional<AssessmentRecord> findByLegacyAssessmentId(String legacyAssessmentId);
}
