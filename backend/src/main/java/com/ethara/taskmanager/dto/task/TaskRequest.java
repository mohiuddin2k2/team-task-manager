package com.ethara.taskmanager.dto.task;

import com.ethara.taskmanager.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record TaskRequest(
    @NotBlank(message = "Task title is required")
    String title,

    @NotBlank(message = "Task description is required")
    String description,

    @NotNull(message = "Task status is required")
    TaskStatus status,

    @NotNull(message = "Task due date is required")
    LocalDate dueDate,

    Long assigneeId,

    Long parentTaskId
) {
}
