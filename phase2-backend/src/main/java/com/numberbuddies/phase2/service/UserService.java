package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AiReport;
import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.ParentStudentLink;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.TeacherStudentLink;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.request.LinkChildRequest;
import com.numberbuddies.phase2.dto.request.LinkStudentRequest;
import com.numberbuddies.phase2.dto.request.UserProfileSyncRequest;
import com.numberbuddies.phase2.dto.response.ChildSummaryResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AiReportRepository;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.ParentStudentLinkRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.TeacherStudentLinkRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final QuestionResultRepository questionResultRepository;
    private final AiReportRepository aiReportRepository;
    private final ParentStudentLinkRepository parentStudentLinkRepository;
    private final TeacherStudentLinkRepository teacherStudentLinkRepository;

    public UserService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            QuestionResultRepository questionResultRepository,
            AiReportRepository aiReportRepository,
            ParentStudentLinkRepository parentStudentLinkRepository,
            TeacherStudentLinkRepository teacherStudentLinkRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.questionResultRepository = questionResultRepository;
        this.aiReportRepository = aiReportRepository;
        this.parentStudentLinkRepository = parentStudentLinkRepository;
        this.teacherStudentLinkRepository = teacherStudentLinkRepository;
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

    private boolean isRoleMatch(String actualRole, String expectedRole) {
        if (actualRole == null) return false;
        String clean = actualRole.trim().toLowerCase();
        String expectedClean = expectedRole.trim().toLowerCase();
        return clean.equals(expectedClean) || clean.equals("role_" + expectedClean);
    }

    @Transactional
    public void linkChild(LinkChildRequest request) {
        UserProfile parent = userProfileRepository.findByExternalUserId(request.getParentExternalUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent profile not found"));

        if (!isRoleMatch(parent.getRole(), "parent")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Specified user is not a parent");
        }

        UserProfile child = findStudentProfile(request.getChildExternalUserId(), request.getStudentCode());

        if (!isRoleMatch(child.getRole(), "student")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Specified child is not a student account");
        }

        // Save in separate ParentStudentLink table without duplicate links
        if (!parentStudentLinkRepository.existsByParentAndStudent(parent, child)) {
            parentStudentLinkRepository.save(new ParentStudentLink(parent, child));
        }

        // Backward compatibility
        child.setParent(parent);
        userProfileRepository.save(child);
    }

    @Transactional
    public void linkStudentToTeacher(String teacherExternalUserId, String studentExternalUserId) {
        linkStudentToTeacher(teacherExternalUserId, studentExternalUserId, null, null, null);
    }

    @Transactional
    public void linkStudentToTeacher(LinkStudentRequest request) {
        linkStudentToTeacher(
                request.getTeacherExternalUserId(),
                request.getStudentExternalUserId(),
                request.getStudentCode(),
                request.getClassName(),
                request.getSectionName()
        );
    }

    @Transactional
    public void linkStudentToTeacher(
            String teacherExternalUserId,
            String studentExternalUserId,
            String studentCode,
            String className,
            String sectionName
    ) {
        UserProfile teacher = userProfileRepository.findByExternalUserId(teacherExternalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Teacher profile not found"));

        if (!isRoleMatch(teacher.getRole(), "teacher")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Specified user is not a teacher");
        }

        UserProfile student = findStudentProfile(studentExternalUserId, studentCode);

        if (!isRoleMatch(student.getRole(), "student")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot link a non-student account");
        }

        if (!teacherStudentLinkRepository.existsByTeacherAndStudent(teacher, student)) {
            teacherStudentLinkRepository.save(new TeacherStudentLink(teacher, student, className, sectionName));
        }

        // Backward compatibility
        student.setTeacher(teacher);
        userProfileRepository.save(student);
    }

    private UserProfile findStudentProfile(String externalUserId, String studentCode) {
        if (studentCode != null && !studentCode.isBlank()) {
            String code = studentCode.trim().toUpperCase();
            Optional<UserProfile> byCode = userProfileRepository.findByStudentCode(code);
            if (byCode.isPresent()) return byCode.get();
        }
        if (externalUserId != null && !externalUserId.isBlank()) {
            Optional<UserProfile> byExt = userProfileRepository.findByExternalUserId(externalUserId.trim());
            if (byExt.isPresent()) return byExt.get();
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Student profile not found with the provided ID code");
    }

    @Transactional(readOnly = true)
    public List<ChildSummaryResponse> getChildren(String parentExternalUserId) {
        UserProfile parent = userProfileRepository.findByExternalUserId(parentExternalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent profile not found"));

        Map<UUID, UserProfile> childMap = new LinkedHashMap<>();

        // Get from parent_student_links table
        for (ParentStudentLink link : parentStudentLinkRepository.findByParent_ExternalUserId(parentExternalUserId)) {
            if (link.getStudent() != null) {
                childMap.put(link.getStudent().getId(), link.getStudent());
            }
        }

        // Get from embedded fallback
        for (UserProfile c : userProfileRepository.findByParent_ExternalUserId(parentExternalUserId)) {
            childMap.putIfAbsent(c.getId(), c);
        }

        return buildSummaries(new ArrayList<>(childMap.values()), null);
    }

    @Transactional(readOnly = true)
    public List<ChildSummaryResponse> getTeacherStudents(String teacherExternalUserId) {
        UserProfile teacher = userProfileRepository.findByExternalUserId(teacherExternalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Teacher profile not found"));

        Map<UUID, UserProfile> studentMap = new LinkedHashMap<>();
        Map<UUID, TeacherStudentLink> linkMap = new HashMap<>();

        for (TeacherStudentLink link : teacherStudentLinkRepository.findByTeacher_ExternalUserId(teacherExternalUserId)) {
            if (link.getStudent() != null) {
                studentMap.put(link.getStudent().getId(), link.getStudent());
                linkMap.put(link.getStudent().getId(), link);
            }
        }

        for (UserProfile s : userProfileRepository.findByTeacher_ExternalUserId(teacherExternalUserId)) {
            studentMap.putIfAbsent(s.getId(), s);
        }

        return buildSummaries(new ArrayList<>(studentMap.values()), linkMap);
    }

    private List<ChildSummaryResponse> buildSummaries(List<UserProfile> students, Map<UUID, TeacherStudentLink> linkMap) {
        List<ChildSummaryResponse> summaries = new ArrayList<>();

        for (UserProfile child : students) {
            ChildSummaryResponse summary = new ChildSummaryResponse();
            summary.setExternalUserId(child.getExternalUserId());
            summary.setName(child.getName());
            summary.setGrade(child.getGrade());
            summary.setAge(child.getAge());
            summary.setStudentCode(child.getStudentCode());

            if (linkMap != null && linkMap.containsKey(child.getId())) {
                TeacherStudentLink tsl = linkMap.get(child.getId());
                summary.setClassName(tsl.getClassName());
                summary.setSectionName(tsl.getSectionName());
            }

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
