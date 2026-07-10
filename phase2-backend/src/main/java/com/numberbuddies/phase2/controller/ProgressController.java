package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.response.ProgressDashboardResponse;
import com.numberbuddies.phase2.service.ProgressDashboardService;
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

    @GetMapping("/dashboard")
    public ResponseEntity<ProgressDashboardResponse> getDashboard(
            @RequestParam String externalUserId,
            @RequestParam(defaultValue = "weekly") String periodType
    ) {
        ProgressDashboardResponse response = progressDashboardService.getDashboard(externalUserId, periodType);
        return ResponseEntity.ok(response);
    }
}
