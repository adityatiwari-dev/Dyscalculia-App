package com.numberbuddies.phase2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.numberbuddies.phase2.dto.request.LinkChildRequest;
import com.numberbuddies.phase2.dto.request.LinkStudentRequest;
import com.numberbuddies.phase2.dto.request.RegisterRequest;
import com.numberbuddies.phase2.dto.response.AuthResponse;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class LinkingFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Test
    public void testStudentParentAndTeacherLinkingFlows() throws Exception {
        // 1. Register a new student
        RegisterRequest studentReq = new RegisterRequest();
        studentReq.setEmail("student_test_flow@example.com");
        studentReq.setName("Test Student");
        studentReq.setPassword("Password123!");
        studentReq.setRole("student");
        studentReq.setAge(8);
        studentReq.setGrade("Grade 3");

        MvcResult studentResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studentReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse studentAuth = objectMapper.readValue(
                studentResult.getResponse().getContentAsString(), AuthResponse.class);

        Assertions.assertNotNull(studentAuth.getId(), "Student ID should not be null");
        Assertions.assertNotNull(studentAuth.getStudentCode(), "Student code should not be null");
        Assertions.assertEquals("student", studentAuth.getRole().toLowerCase(), "Student role should be student");

        // Verify Student persistence in database
        Optional<UserProfile> studentProfileOpt = userProfileRepository.findByEmail("student_test_flow@example.com");
        Assertions.assertTrue(studentProfileOpt.isPresent(), "Student profile must be saved in database");
        UserProfile studentProfile = studentProfileOpt.get();
        Assertions.assertEquals(studentAuth.getStudentCode(), studentProfile.getStudentCode(), "Persistent student code must match AuthResponse");

        // 2. Register a new parent
        RegisterRequest parentReq = new RegisterRequest();
        parentReq.setEmail("parent_test_flow@example.com");
        parentReq.setName("Test Parent");
        parentReq.setPassword("Password123!");
        parentReq.setRole("parent");

        MvcResult parentResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(parentReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse parentAuth = objectMapper.readValue(
                parentResult.getResponse().getContentAsString(), AuthResponse.class);

        Assertions.assertNotNull(parentAuth.getId(), "Parent ID should not be null");
        Assertions.assertEquals("parent", parentAuth.getRole().toLowerCase(), "Parent role should be parent");

        // 3. Parent successfully links the student using both externalUserId and studentCode fallback
        LinkChildRequest linkChildReq = new LinkChildRequest();
        linkChildReq.setParentExternalUserId(parentAuth.getId());
        linkChildReq.setChildExternalUserId(studentAuth.getStudentCode());
        linkChildReq.setStudentCode(studentAuth.getStudentCode());

        mockMvc.perform(post("/api/v2/users/link-child")
                .header("Authorization", "Bearer " + parentAuth.getToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(linkChildReq)))
                .andExpect(status().isOk());

        // 4. Register a new teacher (and test ROLE_TEACHER normalization)
        RegisterRequest teacherReq = new RegisterRequest();
        teacherReq.setEmail("teacher_test_flow@example.com");
        teacherReq.setName("Test Teacher");
        teacherReq.setPassword("Password123!");
        teacherReq.setRole("ROLE_TEACHER"); // Test leading ROLE_ prefix handling during registration

        MvcResult teacherResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(teacherReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse teacherAuth = objectMapper.readValue(
                teacherResult.getResponse().getContentAsString(), AuthResponse.class);

        Assertions.assertNotNull(teacherAuth.getId(), "Teacher ID should not be null");
        Assertions.assertEquals("teacher", teacherAuth.getRole().toLowerCase(), "Teacher role must be normalized to teacher without ROLE_ prefix");

        // 5. Teacher successfully links the student (testing both role authorization via SecurityConfig and linkStudentToTeacher logic)
        LinkStudentRequest linkStudentReq = new LinkStudentRequest();
        linkStudentReq.setTeacherExternalUserId(teacherAuth.getId());
        linkStudentReq.setStudentExternalUserId(studentAuth.getStudentCode());
        linkStudentReq.setStudentCode(studentAuth.getStudentCode());
        linkStudentReq.setClassName("Math 101");
        linkStudentReq.setSectionName("Section A");

        mockMvc.perform(post("/api/v2/teacher/link-student")
                .header("Authorization", "Bearer " + teacherAuth.getToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(linkStudentReq)))
                .andExpect(status().isOk());
    }
}
