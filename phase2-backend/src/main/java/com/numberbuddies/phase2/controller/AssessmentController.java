package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.request.AssessmentSyncRequest;
import com.numberbuddies.phase2.dto.response.AssessmentHistoryDetailResponse;
import com.numberbuddies.phase2.dto.response.AssessmentHistorySummaryResponse;
import com.numberbuddies.phase2.service.AssessmentHistoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/assessments")
public class AssessmentController {

    private final AssessmentHistoryService assessmentHistoryService;

    public AssessmentController(AssessmentHistoryService assessmentHistoryService) {
        this.assessmentHistoryService = assessmentHistoryService;
    }

    @PostMapping("/sync")
    public ResponseEntity<AssessmentHistoryDetailResponse> syncAssessment(
            @Valid @RequestBody AssessmentSyncRequest request
    ) {
        AssessmentHistoryDetailResponse response = assessmentHistoryService.syncAssessment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AssessmentHistorySummaryResponse>> getHistory(
            @RequestParam String externalUserId
    ) {
        return ResponseEntity.ok(assessmentHistoryService.getHistory(externalUserId));
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<AssessmentHistoryDetailResponse> getAssessmentDetail(
            @PathVariable UUID id,
            @RequestParam String externalUserId
    ) {
        return ResponseEntity.ok(assessmentHistoryService.getAssessmentDetail(id, externalUserId));
    }

    @GetMapping("/results")
    public ResponseEntity<List<java.util.Map<String, Object>>> getDetailedResults(
            @RequestParam(required = false) String externalUserId,
            @RequestParam(required = false) String email
    ) {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String authName = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? auth.getName() : null;
        return ResponseEntity.ok(assessmentHistoryService.getDetailedResults(authName, email, externalUserId));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        String csvData = assessmentHistoryService.exportCsv(email);

        byte[] bytes = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(org.springframework.http.ContentDisposition.builder("attachment")
                .filename("assessment_results.csv")
                .build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(bytes);
    }
}
