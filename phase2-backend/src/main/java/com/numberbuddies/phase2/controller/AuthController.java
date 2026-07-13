package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.dto.request.LoginRequest;
import com.numberbuddies.phase2.dto.request.RegisterRequest;
import com.numberbuddies.phase2.dto.response.AuthResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import com.numberbuddies.phase2.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userProfileRepository.findByEmail(request.getEmail().toLowerCase()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User already exists");
        }

        UserProfile user = new UserProfile();
        user.setEmail(request.getEmail().toLowerCase());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAge(request.getAge());
        user.setGrade(request.getGrade());
        user.setLanguage(request.getLanguage());
        user.setEducationalBoard(request.getEducationalBoard());
        user.setConsent(request.getConsent());
        if (Boolean.TRUE.equals(request.getConsent())) {
            user.setConsentDate(OffsetDateTime.now());
        }
        String requestedRole = request.getRole() != null && !request.getRole().isBlank() ? request.getRole().trim().toLowerCase() : "student";
        if ("admin".equals(requestedRole) || "role_admin".equals(requestedRole)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin accounts cannot be created via public registration");
        }
        user.setRole(requestedRole);

        // Set externalUserId dynamically to support unified database schema compatibility
        UUID newId = UUID.randomUUID();
        user.setId(newId);
        user.setExternalUserId(newId.toString());

        userProfileRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());

        AuthResponse response = new AuthResponse();
        response.setId(user.getExternalUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setToken(token);
        response.setStudentCode(user.getStudentCode());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        UserProfile user = userProfileRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());

        AuthResponse response = new AuthResponse();
        response.setId(user.getExternalUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setToken(token);
        response.setStudentCode(user.getStudentCode());

        return ResponseEntity.ok(response);
    }
}
