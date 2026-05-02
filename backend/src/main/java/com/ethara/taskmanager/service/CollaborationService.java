package com.ethara.taskmanager.service;

import com.ethara.taskmanager.dto.collaboration.CommentRequest;
import com.ethara.taskmanager.dto.collaboration.CommentResponse;
import com.ethara.taskmanager.dto.collaboration.DirectMessageResponse;
import com.ethara.taskmanager.dto.collaboration.MessageRequest;
import com.ethara.taskmanager.dto.collaboration.MessageResponse;
import com.ethara.taskmanager.entity.DirectMessage;
import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.ProjectMessage;
import com.ethara.taskmanager.entity.Role;
import com.ethara.taskmanager.entity.Task;
import com.ethara.taskmanager.entity.TaskComment;
import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.exception.ApiException;
import com.ethara.taskmanager.repository.DirectMessageRepository;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.ProjectMessageRepository;
import com.ethara.taskmanager.repository.TaskCommentRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import com.ethara.taskmanager.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CollaborationService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final ProjectMessageRepository projectMessageRepository;
    private final DirectMessageRepository directMessageRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public CollaborationService(ProjectService projectService, TaskRepository taskRepository,
                                TaskCommentRepository taskCommentRepository, ProjectMessageRepository projectMessageRepository,
                                DirectMessageRepository directMessageRepository, ProjectMemberRepository projectMemberRepository,
                                UserRepository userRepository) {
        this.projectService = projectService;
        this.taskRepository = taskRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.projectMessageRepository = projectMessageRepository;
        this.directMessageRepository = directMessageRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    public List<CommentResponse> getTaskComments(Long taskId, User currentUser) {
        Task task = getAccessibleTask(taskId, currentUser);
        return taskCommentRepository.findByTaskOrderByCreatedAtAsc(task).stream()
            .map(comment -> new CommentResponse(
                comment.getId(),
                comment.getAuthor().getName(),
                comment.getAuthor().getRole(),
                comment.getContent(),
                comment.getCreatedAt()
            ))
            .toList();
    }

    public CommentResponse addTaskComment(Long taskId, CommentRequest request, User currentUser) {
        Task task = getAccessibleTask(taskId, currentUser);
        validateCommentPermission(task, currentUser);

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(currentUser);
        comment.setContent(normalizeContent(request.content(), "Comment text is required"));
        TaskComment savedComment = taskCommentRepository.save(comment);

        return new CommentResponse(
            savedComment.getId(),
            currentUser.getName(),
            currentUser.getRole(),
            savedComment.getContent(),
            savedComment.getCreatedAt()
        );
    }

    public List<MessageResponse> getProjectMessages(Long projectId, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);
        return projectMessageRepository.findTop30ByProjectOrderByCreatedAtDesc(project).stream()
            .map(message -> new MessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getRole(),
                message.getContent(),
                message.getCreatedAt()
            ))
            .sorted(java.util.Comparator.comparing(MessageResponse::createdAt))
            .toList();
    }

    public MessageResponse addProjectMessage(Long projectId, MessageRequest request, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);

        ProjectMessage message = new ProjectMessage();
        message.setProject(project);
        message.setSender(currentUser);
        message.setContent(normalizeContent(request.content(), "Message text is required"));
        ProjectMessage savedMessage = projectMessageRepository.save(message);

        return new MessageResponse(
            savedMessage.getId(),
            currentUser.getId(),
            currentUser.getName(),
            currentUser.getRole(),
            savedMessage.getContent(),
            savedMessage.getCreatedAt()
        );
    }

    public List<DirectMessageResponse> getDirectConversation(Long projectId, Long otherUserId, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);
        User otherUser = getOtherUser(project, otherUserId, currentUser);

        return directMessageRepository.findConversation(project, currentUser, otherUser).stream()
            .map(message -> new DirectMessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getRole(),
                message.getRecipient().getId(),
                message.getRecipient().getName(),
                message.getContent(),
                message.getCreatedAt()
            ))
            .toList();
    }

    public DirectMessageResponse sendDirectMessage(Long projectId, Long otherUserId, MessageRequest request, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);
        User otherUser = getOtherUser(project, otherUserId, currentUser);

        DirectMessage message = new DirectMessage();
        message.setProject(project);
        message.setSender(currentUser);
        message.setRecipient(otherUser);
        message.setContent(normalizeContent(request.content(), "Message text is required"));
        DirectMessage savedMessage = directMessageRepository.save(message);

        return new DirectMessageResponse(
            savedMessage.getId(),
            currentUser.getId(),
            currentUser.getName(),
            currentUser.getRole(),
            otherUser.getId(),
            otherUser.getName(),
            savedMessage.getContent(),
            savedMessage.getCreatedAt()
        );
    }

    private Task getAccessibleTask(Long taskId, User currentUser) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        projectService.getAccessibleProject(task.getProject().getId(), currentUser);
        return task;
    }

    private void validateCommentPermission(Task task, User currentUser) {
        boolean canComment = currentUser.getRole() == Role.PROJECT_MANAGER
            || currentUser.getRole() == Role.TEAM_LEAD
            || (task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId()));

        if (!canComment) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only project managers, team leads, or the assigned employee can comment");
        }
    }

    private User getOtherUser(Project project, Long otherUserId, User currentUser) {
        if (currentUser.getId().equals(otherUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot open a direct conversation with yourself");
        }

        User otherUser = userRepository.findById(otherUserId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        boolean otherUserInProject = project.getOwner().getId().equals(otherUser.getId())
            || projectMemberRepository.existsByProjectAndUser(project, otherUser);

        if (!otherUserInProject) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Direct messaging is only available with members of the selected project");
        }

        return otherUser;
    }

    private String normalizeContent(String value, String message) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }
}
