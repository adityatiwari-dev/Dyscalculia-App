package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecord, UUID> {

    @EntityGraph(attributePaths = {"questionResults"})
    List<AssessmentRecord> findByUser_IdOrderByCompletedAtDesc(UUID userId);

    Optional<AssessmentRecord> findByLegacyAssessmentId(String legacyAssessmentId);

    @Query("SELECT DISTINCT a FROM AssessmentRecord a JOIN FETCH a.user")
    List<AssessmentRecord> findAllWithUser();
}
