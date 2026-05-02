package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.Task;
import com.ethara.taskmanager.entity.TaskStatus;
import com.ethara.taskmanager.entity.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectOrderByDueDateAsc(Project project);

    List<Task> findByParentTaskOrderByDueDateAsc(Task parentTask);

    long countByProjectIn(List<Project> projects);

    long countByProjectInAndStatus(List<Project> projects, TaskStatus status);

    long countByProjectInAndDueDateBeforeAndStatusNot(List<Project> projects, LocalDate date, TaskStatus status);

    @Query("""
        select t from Task t
        where t.assignee = :user
        order by t.dueDate asc
        """)
    List<Task> findAssignedTasks(User user);
}
