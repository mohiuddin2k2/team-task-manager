package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.ProjectMember;
import com.ethara.taskmanager.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    boolean existsByProjectAndUser(Project project, User user);

    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    List<ProjectMember> findByProject(Project project);
}
