package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.AssessmentQuestion;
import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, UUID> {

    List<AssessmentQuestion> findByTopicAndDifficulty(WeakTopic topic, DifficultyLevel difficulty);

    List<AssessmentQuestion> findByTopic(WeakTopic topic);

    List<AssessmentQuestion> findByDifficulty(DifficultyLevel difficulty);
}
