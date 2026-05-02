package com.ethara.taskmanager.dto.task;

import com.ethara.taskmanager.entity.Role;
import com.ethara.taskmanager.entity.TaskStatus;
import java.time.LocalDate;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskStatus status,
    LocalDate dueDate,
    Long parentTaskId,
    String parentTaskTitle,
    String createdByName,
    Role createdByRole,
    String assigneeName,
    Long assigneeId,
    Role assigneeRole,
    Long projectId,
    String projectName,
    int childTaskCount,
    int completedChildTaskCount
) {
}
