package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.ParentObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParentObservationRepository extends JpaRepository<ParentObservation, UUID> {

    List<ParentObservation> findByStudent_IdOrderByCreatedAtDesc(UUID studentId);

    List<ParentObservation> findByStudent_ExternalUserIdOrderByCreatedAtDesc(String studentExternalUserId);

    List<ParentObservation> findByStudent_ExternalUserIdInOrderByCreatedAtDesc(List<String> studentExternalUserIds);
}
