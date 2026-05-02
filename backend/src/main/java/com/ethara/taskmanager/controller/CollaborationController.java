package com.ethara.taskmanager.controller;

import com.ethara.taskmanager.dto.collaboration.CommentRequest;
import com.ethara.taskmanager.dto.collaboration.CommentResponse;
import com.ethara.taskmanager.dto.collaboration.DirectMessageResponse;
import com.ethara.taskmanager.dto.collaboration.MessageRequest;
import com.ethara.taskmanager.dto.collaboration.MessageResponse;
import com.ethara.taskmanager.service.CollaborationService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class CollaborationController {

    private final CollaborationService collaborationService;
    private final UserContextService userContextService;

    public CollaborationController(CollaborationService collaborationService, UserContextService userContextService) {
        this.collaborationService = collaborationService;
        this.userContextService = userContextService;
    }

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentResponse>> getTaskComments(@PathVariable Long taskId, Authentication authentication) {
        return ResponseEntity.ok(collaborationService.getTaskComments(taskId, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<CommentResponse> addTaskComment(@PathVariable Long taskId,
                                                          @Valid @RequestBody CommentRequest request,
                                                          Authentication authentication) {
        return ResponseEntity.ok(collaborationService.addTaskComment(taskId, request, userContextService.getCurrentUser(authentication)));
    }

    @GetMapping("/projects/{projectId}/messages")
    public ResponseEntity<List<MessageResponse>> getProjectMessages(@PathVariable Long projectId, Authentication authentication) {
        return ResponseEntity.ok(collaborationService.getProjectMessages(projectId, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping("/projects/{projectId}/messages")
    public ResponseEntity<MessageResponse> addProjectMessage(@PathVariable Long projectId,
                                                             @Valid @RequestBody MessageRequest request,
                                                             Authentication authentication) {
        return ResponseEntity.ok(collaborationService.addProjectMessage(projectId, request, userContextService.getCurrentUser(authentication)));
    }

    @GetMapping("/projects/{projectId}/direct-messages/{otherUserId}")
    public ResponseEntity<List<DirectMessageResponse>> getDirectConversation(@PathVariable Long projectId,
                                                                             @PathVariable Long otherUserId,
                                                                             Authentication authentication) {
        return ResponseEntity.ok(collaborationService.getDirectConversation(projectId, otherUserId, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping("/projects/{projectId}/direct-messages/{otherUserId}")
    public ResponseEntity<DirectMessageResponse> sendDirectMessage(@PathVariable Long projectId,
                                                                   @PathVariable Long otherUserId,
                                                                   @Valid @RequestBody MessageRequest request,
                                                                   Authentication authentication) {
        return ResponseEntity.ok(collaborationService.sendDirectMessage(projectId, otherUserId, request, userContextService.getCurrentUser(authentication)));
    }
}
