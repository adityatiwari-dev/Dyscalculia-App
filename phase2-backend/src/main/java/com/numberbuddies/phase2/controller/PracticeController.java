package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.request.PracticeGenerateRequest;
import com.numberbuddies.phase2.dto.request.PracticeSubmitRequest;
import com.numberbuddies.phase2.dto.response.PracticeGenerateResponse;
import com.numberbuddies.phase2.dto.response.PracticeSessionSummaryResponse;
import com.numberbuddies.phase2.dto.response.PracticeSubmitResponse;
import com.numberbuddies.phase2.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v2/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @PostMapping("/generate")
    public ResponseEntity<PracticeGenerateResponse> generate(
            @Valid @RequestBody PracticeGenerateRequest request
    ) {
        PracticeGenerateResponse response = practiceService.generate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/submit")
    public ResponseEntity<PracticeSubmitResponse> submit(
            @Valid @RequestBody PracticeSubmitRequest request
    ) {
        return ResponseEntity.ok(practiceService.submit(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PracticeSessionSummaryResponse>> history(
            @RequestParam(required = false) String externalUserId,
            @RequestParam(required = false) String userId
    ) {
        String resolvedId = (externalUserId != null && !externalUserId.isBlank()) ? externalUserId.trim() : userId;
        if (resolvedId == null || resolvedId.isBlank()) {
            throw new com.numberbuddies.phase2.exception.ApiException(HttpStatus.BAD_REQUEST, "externalUserId or userId is required");
        }
        return ResponseEntity.ok(practiceService.getHistory(resolvedId));
    }
}
