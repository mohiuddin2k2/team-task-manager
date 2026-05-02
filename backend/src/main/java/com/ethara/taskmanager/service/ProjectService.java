package com.ethara.taskmanager.service;

import com.ethara.taskmanager.dto.project.MemberRequest;
import com.ethara.taskmanager.dto.project.MemberResponse;
import com.ethara.taskmanager.dto.project.ProjectRequest;
import com.ethara.taskmanager.dto.project.ProjectResponse;
import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.ProjectMember;
import com.ethara.taskmanager.entity.Role;
import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.exception.ApiException;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.ProjectRepository;
import com.ethara.taskmanager.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    public List<ProjectResponse> getProjects(User currentUser) {
        return projectRepository.findAccessibleProjects(currentUser).stream()
            .map(this::toResponse)
            .toList();
    }

    public ProjectResponse getProject(Long projectId, User currentUser) {
        Project project = getAccessibleProject(projectId, currentUser);
        return toResponse(project);
    }

    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        if (!currentUser.getRole().canCreateProjects()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only project managers can create projects");
        }

        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setDueDate(request.dueDate());
        project.setOwner(currentUser);
        Project savedProject = projectRepository.save(project);

        ProjectMember ownerMembership = new ProjectMember();
        ownerMembership.setProject(savedProject);
        ownerMembership.setUser(currentUser);
        projectMemberRepository.save(ownerMembership);

        return toResponse(savedProject);
    }

    public ProjectResponse addMember(Long projectId, MemberRequest request, User currentUser) {
        Project project = getProjectManagedByCurrentUser(projectId, currentUser);
        User member = userRepository.findByEmail(request.email().toLowerCase())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User with this email does not exist"));

        if (!projectMemberRepository.existsByProjectAndUser(project, member)) {
            ProjectMember membership = new ProjectMember();
            membership.setProject(project);
            membership.setUser(member);
            projectMemberRepository.save(membership);
        }

        return toResponse(project);
    }

    public List<MemberResponse> searchUsers(String term) {
        return userRepository.findTop10ByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(term, term).stream()
            .map(user -> new MemberResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()))
            .toList();
    }

    public Project getAccessibleProject(Long projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));

        boolean hasAccess = project.getOwner().getId().equals(currentUser.getId())
            || projectMemberRepository.existsByProjectAndUser(project, currentUser);

        if (!hasAccess) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this project");
        }
        return project;
    }

    public Project getProjectManagedByCurrentUser(Long projectId, User currentUser) {
        Project project = getAccessibleProject(projectId, currentUser);
        if (!currentUser.getRole().canManageProjectTeam() || !project.getOwner().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owning project manager can manage team members");
        }
        return project;
    }

    private ProjectResponse toResponse(Project project) {
        List<MemberResponse> members = projectMemberRepository.findByProject(project).stream()
            .map(ProjectMember::getUser)
            .distinct()
            .map(user -> new MemberResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()))
            .toList();

        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getDescription(),
            project.getDueDate(),
            project.getOwner().getId(),
            project.getOwner().getName(),
            members
        );
    }
}
