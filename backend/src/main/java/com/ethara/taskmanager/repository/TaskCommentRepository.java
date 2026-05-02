package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.Task;
import com.ethara.taskmanager.entity.TaskComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    List<TaskComment> findByTaskOrderByCreatedAtAsc(Task task);
}
