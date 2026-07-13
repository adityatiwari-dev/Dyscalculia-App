package com.numberbuddies.phase2.repository;

import com.numberbuddies.phase2.domain.entity.TeacherStudentLink;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherStudentLinkRepository extends JpaRepository<TeacherStudentLink, UUID> {

    boolean existsByTeacherAndStudent(UserProfile teacher, UserProfile student);

    List<TeacherStudentLink> findByTeacher(UserProfile teacher);

    List<TeacherStudentLink> findByTeacher_ExternalUserId(String teacherExternalUserId);

    List<TeacherStudentLink> findByStudent(UserProfile student);
}
