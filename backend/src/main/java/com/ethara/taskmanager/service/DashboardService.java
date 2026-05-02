package com.ethara.taskmanager.service;

import com.ethara.taskmanager.dto.dashboard.DashboardResponse;
import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.TaskStatus;
import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.repository.ProjectRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;

    public DashboardService(ProjectRepository projectRepository, TaskRepository taskRepository, TaskService taskService) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.taskService = taskService;
    }

    public DashboardResponse getDashboard(User currentUser) {
        java.util.List<Project> projects = projectRepository.findAccessibleProjects(currentUser);

        if (projects.isEmpty()) {
            return new DashboardResponse(0, 0, 0, 0, 0, 0, java.util.List.of());
        }

        return new DashboardResponse(
            projects.size(),
            taskRepository.countByProjectIn(projects),
            taskRepository.countByProjectInAndStatus(projects, TaskStatus.TODO),
            taskRepository.countByProjectInAndStatus(projects, TaskStatus.IN_PROGRESS),
            taskRepository.countByProjectInAndStatus(projects, TaskStatus.DONE),
            taskRepository.countByProjectInAndDueDateBeforeAndStatusNot(projects, LocalDate.now(), TaskStatus.DONE),
            taskRepository.findAssignedTasks(currentUser).stream()
                .map(taskService::toResponse)
                .toList()
        );
    }
}
