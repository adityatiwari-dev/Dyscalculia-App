package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.AssessmentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AssessmentProgressRepository extends JpaRepository<AssessmentProgress, UUID> {
}
