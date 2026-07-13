package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.ParentStudentLink;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ParentStudentLinkRepository extends JpaRepository<ParentStudentLink, UUID> {

    boolean existsByParentAndStudent(UserProfile parent, UserProfile student);

    List<ParentStudentLink> findByParent(UserProfile parent);

    List<ParentStudentLink> findByParent_ExternalUserId(String parentExternalUserId);

    List<ParentStudentLink> findByStudent(UserProfile student);
}
