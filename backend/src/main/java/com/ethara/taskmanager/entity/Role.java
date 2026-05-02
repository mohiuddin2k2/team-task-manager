package com.ethara.taskmanager.entity;

public enum Role {
    PROJECT_MANAGER,
    TEAM_LEAD,
    EMPLOYEE;

    public boolean canCreateProjects() {
        return this == PROJECT_MANAGER;
    }

    public boolean canManageProjectTeam() {
        return this == PROJECT_MANAGER;
    }

    public boolean canPlanTasks() {
        return this == PROJECT_MANAGER || this == TEAM_LEAD;
    }
}
