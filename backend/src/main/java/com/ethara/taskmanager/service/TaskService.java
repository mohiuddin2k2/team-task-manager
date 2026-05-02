package com.ethara.taskmanager.service;

import com.ethara.taskmanager.dto.task.TaskRequest;
import com.ethara.taskmanager.dto.task.TaskResponse;
import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.Role;
import com.ethara.taskmanager.entity.Task;
import com.ethara.taskmanager.entity.TaskStatus;
import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.exception.ApiException;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import com.ethara.taskmanager.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository,
                       ProjectService projectService, ProjectMemberRepository projectMemberRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.projectMemberRepository = projectMemberRepository;
    }

    public List<TaskResponse> getTasksByProject(Long projectId, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);
        List<Task> tasks = taskRepository.findByProjectOrderByDueDateAsc(project);
        tasks.stream()
            .filter(task -> task.getParentTask() == null)
            .forEach(this::syncParentStatusFromChildren);
        return tasks.stream()
            .map(this::toResponse)
            .toList();
    }

    public TaskResponse createTask(Long projectId, TaskRequest request, User currentUser) {
        Project project = projectService.getAccessibleProject(projectId, currentUser);
        validateTaskPlanningPermission(project, currentUser);

        Task parentTask = resolveParentTask(project, request.parentTaskId());
        User assignee = resolveAssignee(project, request.assigneeId());
        validateAssignmentFlow(currentUser, assignee, parentTask);

        Task task = new Task();
        task.setTitle(request.title().trim());
        task.setDescription(request.description().trim());
        task.setStatus(request.status());
        task.setDueDate(request.dueDate());
        task.setProject(project);
        task.setParentTask(parentTask);
        task.setCreatedBy(currentUser);
        task.setAssignee(assignee);

        Task savedTask = taskRepository.save(task);
        refreshParentHierarchy(savedTask);
        return toResponse(savedTask);
    }

    public TaskResponse updateTask(Long taskId, TaskRequest request, User currentUser) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        projectService.getAccessibleProject(task.getProject().getId(), currentUser);

        if (canPlanTaskDetails(task.getProject(), currentUser)) {
            Task parentTask = resolveParentTask(task.getProject(), request.parentTaskId());
            validateParentMutation(task, parentTask);
            User assignee = resolveAssignee(task.getProject(), request.assigneeId());
            validateAssignmentFlow(currentUser, assignee, parentTask);

            task.setTitle(request.title().trim());
            task.setDescription(request.description().trim());
            task.setDueDate(request.dueDate());
            task.setAssignee(assignee);
            task.setParentTask(parentTask);
            task.setStatus(request.status());
        } else if (currentUser.getRole() == Role.EMPLOYEE && isAssignedEmployee(task, currentUser)) {
            validateEmployeeUpdate(task, request);
            task.setStatus(request.status());
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to update this task");
        }

        Task savedTask = taskRepository.save(task);
        refreshParentHierarchy(savedTask);
        return toResponse(savedTask);
    }

    public TaskResponse toResponse(Task task) {
        TaskStatus effectiveStatus = deriveStatus(task);
        List<Task> childTasks = taskRepository.findByParentTaskOrderByDueDateAsc(task);
        long completedChildCount = childTasks.stream()
            .filter(child -> deriveStatus(child) == TaskStatus.DONE)
            .count();

        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            effectiveStatus,
            task.getDueDate(),
            task.getParentTask() != null ? task.getParentTask().getId() : null,
            task.getParentTask() != null ? task.getParentTask().getTitle() : null,
            task.getCreatedBy().getName(),
            task.getCreatedBy().getRole(),
            task.getAssignee() != null ? task.getAssignee().getName() : "Unassigned",
            task.getAssignee() != null ? task.getAssignee().getId() : null,
            task.getAssignee() != null ? task.getAssignee().getRole() : null,
            task.getProject().getId(),
            task.getProject().getName(),
            childTasks.size(),
            (int) completedChildCount
        );
    }

    private void validateEmployeeUpdate(Task task, TaskRequest request) {
        if (!request.title().trim().equals(task.getTitle())
            || !request.description().trim().equals(task.getDescription())
            || !request.dueDate().equals(task.getDueDate())
            || !Objects.equals(request.assigneeId(), task.getAssignee() != null ? task.getAssignee().getId() : null)
            || !Objects.equals(request.parentTaskId(), task.getParentTask() != null ? task.getParentTask().getId() : null)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Employees can only update the status of their assigned tasks");
        }
    }

    private Task resolveParentTask(Project project, Long parentTaskId) {
        if (parentTaskId == null) {
            return null;
        }

        Task parentTask = taskRepository.findById(parentTaskId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Parent task not found"));

        if (!parentTask.getProject().getId().equals(project.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Parent task must belong to the same project");
        }

        if (parentTask.getParentTask() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only top-level tasks can be split into chunks");
        }

        return parentTask;
    }

    private User resolveAssignee(Project project, Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }

        User assignee = userRepository.findById(assigneeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));

        if (!project.getOwner().getId().equals(assignee.getId())
            && !projectMemberRepository.existsByProjectAndUser(project, assignee)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assignee must be part of the project");
        }

        return assignee;
    }

    private void validateTaskPlanningPermission(Project project, User currentUser) {
        if (!canPlanTaskDetails(project, currentUser)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the project manager or team leads can create and plan tasks");
        }
    }

    private boolean canPlanTaskDetails(Project project, User currentUser) {
        return project.getOwner().getId().equals(currentUser.getId()) || currentUser.getRole().canPlanTasks();
    }

    private boolean isAssignedEmployee(Task task, User currentUser) {
        return task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());
    }

    private void validateAssignmentFlow(User currentUser, User assignee, Task parentTask) {
        if (currentUser.getRole() == Role.PROJECT_MANAGER) {
            if (parentTask != null && assignee != null && assignee.getRole() == Role.PROJECT_MANAGER) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Chunks cannot be assigned back to a project manager");
            }
            return;
        }

        if (currentUser.getRole() == Role.TEAM_LEAD) {
            if (parentTask == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Team leads should create chunks under a parent task assigned by the project manager");
            }

            if (parentTask.getAssignee() == null || !parentTask.getAssignee().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You can only split parent tasks assigned to you");
            }

            if (assignee == null || assignee.getRole() != Role.EMPLOYEE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Team leads should assign chunks to employees");
            }
        }
    }

    private void validateParentMutation(Task task, Task newParentTask) {
        if (newParentTask != null && newParentTask.getId().equals(task.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A task cannot be its own parent");
        }

        if (!taskRepository.findByParentTaskOrderByDueDateAsc(task).isEmpty() && newParentTask != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A parent task with existing chunks cannot become a child task");
        }
    }

    private void refreshParentHierarchy(Task task) {
        if (task.getParentTask() != null) {
            syncParentStatusFromChildren(task.getParentTask());
        } else {
            syncParentStatusFromChildren(task);
        }
    }

    private TaskStatus deriveStatus(Task task) {
        List<Task> childTasks = taskRepository.findByParentTaskOrderByDueDateAsc(task);
        if (childTasks.isEmpty()) {
            return task.getStatus();
        }

        boolean allDone = childTasks.stream().allMatch(child -> deriveStatus(child) == TaskStatus.DONE);
        if (allDone) {
            return TaskStatus.DONE;
        }

        boolean anyStarted = childTasks.stream().anyMatch(child -> {
            TaskStatus childStatus = deriveStatus(child);
            return childStatus == TaskStatus.IN_PROGRESS || childStatus == TaskStatus.DONE;
        });

        return anyStarted ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
    }

    private void syncParentStatusFromChildren(Task task) {
        List<Task> childTasks = taskRepository.findByParentTaskOrderByDueDateAsc(task);
        if (childTasks.isEmpty()) {
            return;
        }

        TaskStatus aggregatedStatus = deriveStatus(task);
        if (task.getStatus() != aggregatedStatus) {
            task.setStatus(aggregatedStatus);
            taskRepository.save(task);
        }
    }
}
