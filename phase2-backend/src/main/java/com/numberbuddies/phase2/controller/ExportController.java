package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/v2/progress/export/csv")
public class ExportController {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;

    public ExportController(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
    }

    @GetMapping
    public void exportStudentHistoryToCsv(
            @RequestParam String studentExternalUserId,
            HttpServletResponse response
    ) throws IOException {
        UserProfile student = userProfileRepository.findByExternalUserId(studentExternalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));

        List<AssessmentRecord> records = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(student.getId());

        String filename = "student_report_" + student.getName().toLowerCase().replace(' ', '_') + ".csv";
        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        PrintWriter writer = response.getWriter();
        // Write CSV Header
        writer.println("Date,Assessment Type,Score,Accuracy (%),Time Taken (s),Total Questions");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        for (AssessmentRecord record : records) {
            writer.println(String.format(
                    "\"%s\",\"%s\",%.1f,%.1f,%.1f,%d",
                    record.getCompletedAt().format(dtf),
                    record.getAssessmentType().name(),
                    record.getTotalScore().doubleValue(),
                    record.getAccuracy().doubleValue(),
                    (record.getTimeTakenMs() / 1000.0),
                    record.getQuestionResults().size()
            ));
        }

        writer.flush();
        writer.close();
    }
}
