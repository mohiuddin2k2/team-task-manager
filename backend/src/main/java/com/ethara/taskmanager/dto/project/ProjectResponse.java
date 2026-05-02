package com.ethara.taskmanager.dto.project;

import java.time.LocalDate;
import java.util.List;

public record ProjectResponse(
    Long id,
    String name,
    String description,
    LocalDate dueDate,
    Long ownerId,
    String ownerName,
    List<MemberResponse> members
) {
}
