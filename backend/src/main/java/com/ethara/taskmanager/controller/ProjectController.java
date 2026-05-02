package com.ethara.taskmanager.controller;

import com.ethara.taskmanager.dto.project.MemberRequest;
import com.ethara.taskmanager.dto.project.MemberResponse;
import com.ethara.taskmanager.dto.project.ProjectRequest;
import com.ethara.taskmanager.dto.project.ProjectResponse;
import com.ethara.taskmanager.service.ProjectService;
import com.ethara.taskmanager.service.UserContextService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final UserContextService userContextService;

    public ProjectController(ProjectService projectService, UserContextService userContextService) {
        this.projectService = projectService;
        this.userContextService = userContextService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(Authentication authentication) {
        return ResponseEntity.ok(projectService.getProjects(userContextService.getCurrentUser(authentication)));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId, Authentication authentication) {
        return ResponseEntity.ok(projectService.getProject(projectId, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request, Authentication authentication) {
        return ResponseEntity.ok(projectService.createProject(request, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping("/{projectId}/team-members")
    public ResponseEntity<ProjectResponse> addTeamMember(@PathVariable Long projectId,
                                                         @Valid @RequestBody MemberRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(projectService.addMember(projectId, request, userContextService.getCurrentUser(authentication)));
    }

    @GetMapping("/team-directory")
    public ResponseEntity<List<MemberResponse>> searchTeamDirectory(@RequestParam String term) {
        return ResponseEntity.ok(projectService.searchUsers(term));
    }
}
