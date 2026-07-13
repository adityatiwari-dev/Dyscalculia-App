package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.dto.request.LinkChildRequest;
import com.numberbuddies.phase2.dto.request.UserProfileSyncRequest;
import com.numberbuddies.phase2.dto.response.ChildSummaryResponse;
import com.numberbuddies.phase2.dto.response.UserProfileResponse;
import com.numberbuddies.phase2.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v2/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/sync")
    public ResponseEntity<UserProfileResponse> syncUser(
            @Valid @RequestBody UserProfileSyncRequest request
    ) {
        UserProfile profile = userService.syncUser(request);
        return ResponseEntity.ok(UserProfileResponse.fromEntity(profile));
    }

    @PostMapping("/link-child")
    public ResponseEntity<Void> linkChild(
            @Valid @RequestBody LinkChildRequest request
    ) {
        userService.linkChild(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/children")
    public ResponseEntity<List<ChildSummaryResponse>> getChildren(
            @RequestParam String parentExternalUserId
    ) {
        List<ChildSummaryResponse> response = userService.getChildren(parentExternalUserId);
        return ResponseEntity.ok(response);
    }
}
