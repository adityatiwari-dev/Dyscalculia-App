package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AiReport;
import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.request.LinkChildRequest;
import com.numberbuddies.phase2.dto.request.UserProfileSyncRequest;
import com.numberbuddies.phase2.dto.response.ChildSummaryResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AiReportRepository;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final QuestionResultRepository questionResultRepository;
    private final AiReportRepository aiReportRepository;

    public UserService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            QuestionResultRepository questionResultRepository,
            AiReportRepository aiReportRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.questionResultRepository = questionResultRepository;
        this.aiReportRepository = aiReportRepository;
    }

    @Transactional
    public UserProfile syncUser(UserProfileSyncRequest request) {
        UserProfile user = userProfileRepository.findByExternalUserId(request.getExternalUserId())
                .orElseGet(() -> {
                    UserProfile created = new UserProfile();
                    created.setExternalUserId(request.getExternalUserId());
                    return created;
                });

        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getName() != null) user.setName(request.getName());
        if (request.getAge() != null) user.setAge(request.getAge());
        if (request.getGrade() != null) user.setGrade(request.getGrade());
        if (request.getRole() != null) user.setRole(request.getRole());

        return userProfileRepository.save(user);
    }

    @Transactional
    public void linkChild(LinkChildRequest request) {
        UserProfile parent = userProfileRepository.findByExternalUserId(request.getParentExternalUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent profile not found"));

        if (!"parent".equalsIgnoreCase(parent.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Specified user is not a parent");
        }

        UserProfile child = userProfileRepository.findByExternalUserId(request.getChildExternalUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Child profile not found"));

        if ("parent".equalsIgnoreCase(child.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot link a parent profile as a child");
        }

        child.setParent(parent);
        userProfileRepository.save(child);
    }

    @Transactional(readOnly = true)
    public List<ChildSummaryResponse> getChildren(String parentExternalUserId) {
        UserProfile parent = userProfileRepository.findByExternalUserId(parentExternalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent profile not found"));

        List<UserProfile> children = userProfileRepository.findByParent_ExternalUserId(parentExternalUserId);
        List<ChildSummaryResponse> summaries = new ArrayList<>();

        for (UserProfile child : children) {
            ChildSummaryResponse summary = new ChildSummaryResponse();
            summary.setExternalUserId(child.getExternalUserId());
            summary.setName(child.getName());
            summary.setGrade(child.getGrade());
            summary.setAge(child.getAge());

            List<AssessmentRecord> assessments = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(child.getId());
            List<QuestionResult> questionResults = questionResultRepository.findByAssessment_User_Id(child.getId());
            List<AiReport> reports = aiReportRepository.findByUser_IdOrderByCreatedAtDesc(child.getId());

            if (assessments.isEmpty()) {
                summary.setOverallAccuracy(BigDecimal.ZERO);
                summary.setLatestAssessmentDate(null);
            } else {
                BigDecimal totalAcc = BigDecimal.ZERO;
                for (AssessmentRecord record : assessments) {
                    totalAcc = totalAcc.add(record.getAccuracy() != null ? record.getAccuracy() : BigDecimal.ZERO);
                }
                summary.setOverallAccuracy(totalAcc.divide(BigDecimal.valueOf(assessments.size()), 2, RoundingMode.HALF_UP));
                summary.setLatestAssessmentDate(assessments.get(0).getCompletedAt());
            }

            if (reports.isEmpty()) {
                summary.setAiRiskLevel("UNKNOWN");
            } else {
                summary.setAiRiskLevel(reports.get(0).getRiskLevel() != null ? reports.get(0).getRiskLevel().name() : "UNKNOWN");
            }

            // Strongest/Weakest Topic calculation
            if (questionResults.isEmpty()) {
                summary.setStrongestTopic("—");
                summary.setWeakestTopic("—");
            } else {
                Map<WeakTopic, List<QuestionResult>> grouped = questionResults.stream()
                        .filter(q -> q.getTopic() != null)
                        .collect(Collectors.groupingBy(QuestionResult::getTopic));

                String strongest = "—";
                String weakest = "—";
                double maxAcc = -1.0;
                double minAcc = 101.0;

                for (Map.Entry<WeakTopic, List<QuestionResult>> entry : grouped.entrySet()) {
                    List<QuestionResult> list = entry.getValue();
                    long count = list.size();
                    long correct = list.stream().filter(QuestionResult::isCorrect).count();
                    double acc = count == 0 ? 0.0 : (correct * 100.0 / count);

                    if (acc > maxAcc) {
                        maxAcc = acc;
                        strongest = entry.getKey().name();
                    }
                    if (acc < minAcc) {
                        minAcc = acc;
                        weakest = entry.getKey().name();
                    }
                }
                summary.setStrongestTopic(strongest);
                summary.setWeakestTopic(weakest);
            }

            summaries.add(summary);
        }

        return summaries;
    }
}
