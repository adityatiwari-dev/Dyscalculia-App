package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.ParentObservation;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.dto.request.ObservationRequest;
import com.numberbuddies.phase2.dto.response.ChildSummaryResponse;
import com.numberbuddies.phase2.dto.response.ObservationResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.ParentObservationRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import com.numberbuddies.phase2.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/observations")
public class ParentObservationController {

    private final ParentObservationRepository observationRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserService userService;

    public ParentObservationController(
            ParentObservationRepository observationRepository,
            UserProfileRepository userProfileRepository,
            UserService userService
    ) {
        this.observationRepository = observationRepository;
        this.userProfileRepository = userProfileRepository;
        this.userService = userService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ObservationResponse>> getObservations(
            @RequestParam(required = false) String studentExternalUserId,
            @RequestParam(required = false) String teacherExternalUserId
    ) {
        List<ParentObservation> list = new ArrayList<>();
        if (studentExternalUserId != null && !studentExternalUserId.isBlank()) {
            list = observationRepository.findByStudent_ExternalUserIdOrderByCreatedAtDesc(studentExternalUserId.trim());
        } else if (teacherExternalUserId != null && !teacherExternalUserId.isBlank()) {
            List<ChildSummaryResponse> students = userService.getTeacherStudents(teacherExternalUserId.trim());
            List<String> studentIds = students.stream()
                    .map(ChildSummaryResponse::getExternalUserId)
                    .filter(id -> id != null && !id.isBlank())
                    .collect(Collectors.toList());
            if (!studentIds.isEmpty()) {
                list = observationRepository.findByStudent_ExternalUserIdInOrderByCreatedAtDesc(studentIds);
            }
        }

        List<ObservationResponse> responses = new ArrayList<>();
        for (ParentObservation item : list) {
            ObservationResponse res = new ObservationResponse();
            res.setId(item.getId());
            res.setParentName(item.getParent() != null && item.getParent().getName() != null ? item.getParent().getName() : "Parent");
            res.setStudentName(item.getStudent() != null && item.getStudent().getName() != null ? item.getStudent().getName() : "Student");
            res.setStudentExternalUserId(item.getStudent() != null ? item.getStudent().getExternalUserId() : null);
            res.setObservationText(item.getObservationText() != null ? item.getObservationText() : "");
            res.setCreatedAt(item.getCreatedAt());
            responses.add(res);
        }

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ObservationResponse> addObservation(
            @Valid @RequestBody ObservationRequest request
    ) {
        UserProfile student = userProfileRepository.findByExternalUserId(request.getStudentExternalUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));

        UserProfile parent = userProfileRepository.findByExternalUserId(request.getParentExternalUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent profile not found"));

        ParentObservation ob = new ParentObservation();
        ob.setStudent(student);
        ob.setParent(parent);
        ob.setObservationText(request.getObservationText());

        ParentObservation saved = observationRepository.saveAndFlush(ob);

        ObservationResponse res = new ObservationResponse();
        res.setId(saved.getId());
        res.setParentName(parent.getName() != null ? parent.getName() : "Parent");
        res.setStudentName(student.getName() != null ? student.getName() : "Student");
        res.setStudentExternalUserId(student.getExternalUserId());
        res.setObservationText(saved.getObservationText() != null ? saved.getObservationText() : "");
        res.setCreatedAt(saved.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}
