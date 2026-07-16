package com.numberbuddies.phase2.security;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserProfileRepository userProfileRepository;

    public CustomUserDetailsService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserProfile userProfile = userProfileRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Use the role defined in UserProfile as the Authority (e.g. ROLE_STUDENT or ROLE_PARENT)
        String rawRole = userProfile.getRole() != null ? userProfile.getRole().trim().toUpperCase() : "STUDENT";
        if (rawRole.startsWith("ROLE_")) {
            rawRole = rawRole.substring(5);
        }
        String userRole = "ROLE_" + rawRole;

        return new User(
                userProfile.getEmail(),
                userProfile.getPassword() != null ? userProfile.getPassword() : "",
                Collections.singletonList(new SimpleGrantedAuthority(userRole))
        );
    }
}
