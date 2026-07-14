package com.numberbuddies.phase2.config;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Component
public class AdminAccountSeeder implements CommandLineRunner {

    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountSeeder(UserProfileRepository userProfileRepository, PasswordEncoder passwordEncoder) {
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String adminEmail = "admin@numberbuddies.com";
        if (userProfileRepository.findByEmail(adminEmail).isEmpty()) {
            UserProfile admin = new UserProfile();
            admin.setId(UUID.randomUUID());
            admin.setExternalUserId("admin-" + UUID.randomUUID().toString());
            admin.setEmail(adminEmail);
            admin.setName("System Admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("admin");
            admin.setConsent(true);
            admin.setConsentDate(OffsetDateTime.now());
            userProfileRepository.save(admin);
        }
    }
}
