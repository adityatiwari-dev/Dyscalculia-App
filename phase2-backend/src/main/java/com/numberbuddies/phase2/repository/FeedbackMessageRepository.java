package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.FeedbackMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FeedbackMessageRepository extends JpaRepository<FeedbackMessage, UUID> {
}
