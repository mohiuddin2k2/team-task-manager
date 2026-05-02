package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.DirectMessage;
import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("""
        select m from DirectMessage m
        where m.project = :project
          and ((m.sender = :currentUser and m.recipient = :otherUser)
           or (m.sender = :otherUser and m.recipient = :currentUser))
        order by m.createdAt asc
        """)
    List<DirectMessage> findConversation(Project project, User currentUser, User otherUser);
}
