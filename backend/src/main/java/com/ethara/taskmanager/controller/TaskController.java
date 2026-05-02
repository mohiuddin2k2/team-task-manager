package com.ethara.taskmanager.controller;

import com.ethara.taskmanager.dto.task.TaskRequest;
import com.ethara.taskmanager.dto.task.TaskResponse;
import com.ethara.taskmanager.service.TaskService;
import com.ethara.taskmanager.service.UserContextService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class TaskController {

    private final TaskService taskService;
    private final UserContextService userContextService;

    public TaskController(TaskService taskService, UserContextService userContextService) {
        this.taskService = taskService;
        this.userContextService = userContextService;
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getProjectTasks(@PathVariable Long projectId, Authentication authentication) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, userContextService.getCurrentUser(authentication)));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long projectId,
                                                   @Valid @RequestBody TaskRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.ok(taskService.createTask(projectId, request, userContextService.getCurrentUser(authentication)));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long taskId,
                                                   @Valid @RequestBody TaskRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, userContextService.getCurrentUser(authentication)));
    }
}
