package com.numberbuddies.phase2.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "parent_student_links")
public class ParentStudentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parent_id", nullable = false)
    private UserProfile parent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private UserProfile student;

    @Column(name = "linked_at", nullable = false)
    private OffsetDateTime linkedAt;

    @PrePersist
    void onCreate() {
        if (linkedAt == null) {
            linkedAt = OffsetDateTime.now();
        }
    }

    public ParentStudentLink() {}

    public ParentStudentLink(UserProfile parent, UserProfile student) {
        this.parent = parent;
        this.student = student;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserProfile getParent() {
        return parent;
    }

    public void setParent(UserProfile parent) {
        this.parent = parent;
    }

    public UserProfile getStudent() {
        return student;
    }

    public void setStudent(UserProfile student) {
        this.student = student;
    }

    public OffsetDateTime getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(OffsetDateTime linkedAt) {
        this.linkedAt = linkedAt;
    }
}
