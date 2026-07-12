package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.FeedbackMessage;
import com.numberbuddies.phase2.repository.FeedbackMessageRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v2/feedback")
public class FeedbackController {

    private final FeedbackMessageRepository feedbackMessageRepository;

    public FeedbackController(FeedbackMessageRepository feedbackMessageRepository) {
        this.feedbackMessageRepository = feedbackMessageRepository;
    }

    @GetMapping
    public ResponseEntity<List<FeedbackMessage>> getAllFeedback() {
        return ResponseEntity.ok(feedbackMessageRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<FeedbackMessage> submitFeedback(@Valid @RequestBody FeedbackMessage message) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackMessageRepository.save(message));
    }
}
