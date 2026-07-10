package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByExternalUserId(String externalUserId);

    List<UserProfile> findByParent_ExternalUserId(String parentExternalUserId);

    Optional<UserProfile> findByEmail(String email);
}
