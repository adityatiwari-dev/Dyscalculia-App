package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.AiReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiReportRepository extends JpaRepository<AiReport, UUID> {

    Optional<AiReport> findByAssessment_Id(UUID assessmentId);

    List<AiReport> findByUser_IdOrderByCreatedAtDesc(UUID userId);
}
