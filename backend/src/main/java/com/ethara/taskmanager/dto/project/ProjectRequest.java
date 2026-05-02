package com.ethara.taskmanager.dto.project;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank(message = "Project name is required")
    String name,

    @NotBlank(message = "Project description is required")
    String description,

    @NotNull(message = "Due date is required")
    @FutureOrPresent(message = "Due date cannot be in the past")
    LocalDate dueDate
) {
}
