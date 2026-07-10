package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.request.AiAnalyzeRequest;
import com.numberbuddies.phase2.dto.response.AiReportResponse;
import com.numberbuddies.phase2.service.AiAnalysisService;
import com.lowagie.text.DocumentException;
import com.numberbuddies.phase2.service.PdfReportGeneratorService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/ai")
public class AiController {

    private final AiAnalysisService aiAnalysisService;
    private final PdfReportGeneratorService pdfReportGeneratorService;

    public AiController(
            AiAnalysisService aiAnalysisService,
            PdfReportGeneratorService pdfReportGeneratorService
    ) {
        this.aiAnalysisService = aiAnalysisService;
        this.pdfReportGeneratorService = pdfReportGeneratorService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AiReportResponse> analyze(@Valid @RequestBody AiAnalyzeRequest request) {
        AiReportResponse response = aiAnalysisService.analyze(
                request.getAssessmentId(),
                request.getExternalUserId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{assessmentId}")
    public ResponseEntity<AiReportResponse> getReport(
            @PathVariable UUID assessmentId,
            @RequestParam String externalUserId
    ) {
        return ResponseEntity.ok(aiAnalysisService.getReport(assessmentId, externalUserId));
    }

    @GetMapping("/reports/{assessmentId}/pdf")
    public ResponseEntity<InputStreamResource> downloadReportPdf(
            @PathVariable UUID assessmentId,
            @RequestParam String externalUserId
    ) {
        ByteArrayInputStream bis = pdfReportGeneratorService.generateReportPdf(assessmentId, externalUserId);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=screening_report_" + assessmentId + ".pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }
}
