package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.dto.request.LinkStudentRequest;
import com.numberbuddies.phase2.dto.response.ChildSummaryResponse;
import com.numberbuddies.phase2.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v2/teacher")
public class TeacherController {

    private final UserService userService;

    public TeacherController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/link-student")
    public ResponseEntity<Void> linkStudent(
            @Valid @RequestBody LinkStudentRequest request
    ) {
        userService.linkStudentToTeacher(request.getTeacherExternalUserId(), request.getStudentExternalUserId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/students")
    public ResponseEntity<List<ChildSummaryResponse>> getStudents(
            @RequestParam String teacherExternalUserId
    ) {
        List<ChildSummaryResponse> response = userService.getTeacherStudents(teacherExternalUserId);
        return ResponseEntity.ok(response);
    }
}
