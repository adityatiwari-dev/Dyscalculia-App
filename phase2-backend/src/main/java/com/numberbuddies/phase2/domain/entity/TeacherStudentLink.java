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
@Table(name = "teacher_student_links")
public class TeacherStudentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserProfile teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private UserProfile student;

    @Column(name = "class_name", length = 100)
    private String className;

    @Column(name = "section_name", length = 50)
    private String sectionName;

    @Column(name = "linked_at", nullable = false)
    private OffsetDateTime linkedAt;

    @PrePersist
    void onCreate() {
        if (linkedAt == null) {
            linkedAt = OffsetDateTime.now();
        }
    }

    public TeacherStudentLink() {}

    public TeacherStudentLink(UserProfile teacher, UserProfile student, String className, String sectionName) {
        this.teacher = teacher;
        this.student = student;
        this.className = className;
        this.sectionName = sectionName;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserProfile getTeacher() {
        return teacher;
    }

    public void setTeacher(UserProfile teacher) {
        this.teacher = teacher;
    }

    public UserProfile getStudent() {
        return student;
    }

    public void setStudent(UserProfile student) {
        this.student = student;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }

    public OffsetDateTime getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(OffsetDateTime linkedAt) {
        this.linkedAt = linkedAt;
    }
}
