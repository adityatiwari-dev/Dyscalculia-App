package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.ParentObservation;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.dto.request.ObservationRequest;
import com.numberbuddies.phase2.dto.response.ObservationResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.ParentObservationRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v2/observations")
public class ParentObservationController {

    private final ParentObservationRepository observationRepository;
    private final UserProfileRepository userProfileRepository;

    public ParentObservationController(
            ParentObservationRepository observationRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.observationRepository = observationRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @GetMapping
    public ResponseEntity<List<ObservationResponse>> getObservations(
            @RequestParam String studentExternalUserId
    ) {
        List<ParentObservation> list = observationRepository.findByStudent_ExternalUserIdOrderByCreatedAtDesc(studentExternalUserId);
        List<ObservationResponse> responses = new ArrayList<>();

        for (ParentObservation item : list) {
            ObservationResponse res = new ObservationResponse();
            res.setId(item.getId());
            res.setParentName(item.getParent().getName());
            res.setObservationText(item.getObservationText());
            res.setCreatedAt(item.getCreatedAt());
            responses.add(res);
        }

        return ResponseEntity.ok(responses);
    }

    @PostMapping
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

        ParentObservation saved = observationRepository.save(ob);

        ObservationResponse res = new ObservationResponse();
        res.setId(saved.getId());
        res.setParentName(parent.getName());
        res.setObservationText(saved.getObservationText());
        res.setCreatedAt(saved.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}
