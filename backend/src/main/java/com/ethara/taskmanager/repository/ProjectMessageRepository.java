package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.ProjectMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMessageRepository extends JpaRepository<ProjectMessage, Long> {

    List<ProjectMessage> findTop30ByProjectOrderByCreatedAtDesc(Project project);
}
