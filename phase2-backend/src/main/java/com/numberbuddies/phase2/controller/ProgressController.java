package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.response.ProgressDashboardResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.service.ProgressDashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/progress")
public class ProgressController {

    private final ProgressDashboardService progressDashboardService;

    public ProgressController(ProgressDashboardService progressDashboardService) {
        this.progressDashboardService = progressDashboardService;
    }

    private String resolveUserIdParam(String externalUserId, String userId) {
        if (externalUserId != null && !externalUserId.isBlank()) {
            return externalUserId.trim();
        }
        if (userId != null && !userId.isBlank()) {
            return userId.trim();
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "externalUserId or userId is required");
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ProgressDashboardResponse> getDashboard(
            @RequestParam(required = false) String externalUserId,
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "weekly") String periodType
    ) {
        String resolvedId = resolveUserIdParam(externalUserId, userId);
        ProgressDashboardResponse response = progressDashboardService.getDashboard(resolvedId, periodType);
        return ResponseEntity.ok(response);
    }
}
