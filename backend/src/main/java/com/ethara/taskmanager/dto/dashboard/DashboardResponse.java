package com.ethara.taskmanager.dto.dashboard;

import com.ethara.taskmanager.dto.task.TaskResponse;
import java.util.List;

public record DashboardResponse(
    long totalProjects,
    long totalTasks,
    long todoTasks,
    long inProgressTasks,
    long doneTasks,
    long overdueTasks,
    List<TaskResponse> myTasks
) {
}
