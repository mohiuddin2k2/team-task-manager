import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearSession, getStoredUser } from "../utils/auth";

const defaultProjectForm = {
  name: "",
  description: "",
  dueDate: ""
};

const defaultTaskForm = {
  title: "",
  description: "",
  status: "TODO",
  dueDate: "",
  assigneeId: "",
  parentTaskId: ""
};

const tourSteps = [
  {
    title: "Workspace home",
    description: "This dashboard gives you a quick operational summary of project count, active work, and overdue tasks so you can scan delivery health in seconds."
  },
  {
    title: "Project navigation",
    description: "Use the collapsible left workspace bar to move between project tools without giving up room from the board and task detail area."
  },
  {
    title: "Execution board",
    description: "The center canvas is focused on project context, hierarchy, and task movement so PMs, leads, and employees all work from the same live delivery picture."
  },
  {
    title: "Collaboration layer",
    description: "Use task comments, team channel messaging, and direct messaging to keep execution aligned without leaving the workspace."
  }
];

const roleLabels = {
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEAD: "Team Lead",
  EMPLOYEE: "Employee"
};

const navItems = [
  { key: "projects", icon: "PJ", label: "Projects" },
  { key: "members", icon: "TM", label: "Team" },
  { key: "tasks", icon: "TK", label: "Tasks" },
  { key: "team", icon: "CH", label: "Channel" },
  { key: "direct", icon: "DM", label: "Direct" },
  { key: "create", icon: "NP", label: "New Project" }
];

export default function DashboardPage({ theme, onToggleTheme }) {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [projectMessages, setProjectMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [directThreads, setDirectThreads] = useState({});
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activePanel, setActivePanel] = useState("projects");
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [memberEmail, setMemberEmail] = useState("");
  const [commentForm, setCommentForm] = useState("");
  const [messageForm, setMessageForm] = useState("");
  const [directMessageForm, setDirectMessageForm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const navigate = useNavigate();
  const user = getStoredUser();

  const canCreateProjects = user.role === "PROJECT_MANAGER";
  const canPlanTasks = user.role === "PROJECT_MANAGER" || user.role === "TEAM_LEAD";

  const projectMembers = selectedProject?.members || [];
  const directContacts = projectMembers.filter((member) => member.id !== user.id);
  const parentTasks = useMemo(() => tasks.filter((task) => task.parentTaskId == null), [tasks]);
  const topLevelTasksForLead = useMemo(
    () => parentTasks.filter((task) => task.assigneeId === user.id || task.createdByRole === "PROJECT_MANAGER"),
    [parentTasks, user.id]
  );
  const employeeTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === user.id && task.childTaskCount === 0),
    [tasks, user.id]
  );
  const boardTasks = useMemo(() => {
    if (user.role === "EMPLOYEE") {
      return employeeTasks;
    }
    if (user.role === "TEAM_LEAD") {
      return topLevelTasksForLead;
    }
    return parentTasks;
  }, [employeeTasks, parentTasks, topLevelTasksForLead, user.role]);

  const tasksByStatus = useMemo(() => ({
    TODO: boardTasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: boardTasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: boardTasks.filter((task) => task.status === "DONE")
  }), [boardTasks]);

  const projectManager = projectMembers.find((member) => member.id === selectedProject?.ownerId)
    || projectMembers.find((member) => member.role === "PROJECT_MANAGER");
  const teamLeads = projectMembers.filter((member) => member.role === "TEAM_LEAD");
  const coworkers = projectMembers.filter((member) => member.role === "EMPLOYEE");
  const selectedTaskChildren = useMemo(
    () => tasks.filter((task) => task.parentTaskId === selectedTask?.id),
    [selectedTask?.id, tasks]
  );
  const selectedContact = directContacts.find((contact) => contact.id === selectedContactId);
  const teamLeadParentOptions = topLevelTasksForLead.filter((task) => task.assigneeId === user.id);
  const channelUnreadCount = useMemo(
    () => getUnreadChannelCount(projectMessages, user.id, selectedProjectId),
    [projectMessages, selectedProjectId, user.id]
  );
  const directUnreadCount = useMemo(
    () => directContacts.reduce(
      (sum, contact) => sum + getUnreadDirectCount(directThreads[contact.id] || [], user.id, selectedProjectId, contact.id),
      0
    ),
    [directContacts, directThreads, selectedProjectId, user.id]
  );
  const taskAssigneeOptions = useMemo(() => {
    if (user.role === "PROJECT_MANAGER") {
      return teamLeads;
    }
    if (user.role === "TEAM_LEAD") {
      return coworkers;
    }
    return [];
  }, [coworkers, teamLeads, user.role]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectDetails(selectedProjectId);
      void loadProjectMessages(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && directContacts.length > 0) {
      void loadAllDirectThreads(selectedProjectId, directContacts);
    } else {
      setDirectThreads({});
    }
  }, [selectedProjectId, directContacts]);

  useEffect(() => {
    if (selectedTask?.id) {
      void loadTaskComments(selectedTask.id);
    } else {
      setTaskComments([]);
    }
  }, [selectedTask?.id]);

  useEffect(() => {
    if (directContacts.length > 0) {
      setSelectedContactId((currentContactId) => currentContactId && directContacts.some((contact) => contact.id === currentContactId)
        ? currentContactId
        : directContacts[0].id);
    } else {
      setSelectedContactId(null);
      setDirectMessages([]);
    }
  }, [selectedProject?.id, directContacts]);

  useEffect(() => {
    if (selectedContactId && selectedProjectId && activePanel === "direct") {
      void loadDirectMessages(selectedProjectId, selectedContactId);
    }
  }, [activePanel, selectedContactId, selectedProjectId]);

  useEffect(() => {
    if (activePanel === "team" && selectedProjectId && projectMessages.length > 0) {
      markChannelAsRead(user.id, selectedProjectId, projectMessages);
    }
  }, [activePanel, projectMessages, selectedProjectId, user.id]);

  useEffect(() => {
    if (activePanel === "direct" && selectedProjectId && selectedContactId && (directThreads[selectedContactId] || []).length > 0) {
      markDirectAsRead(user.id, selectedProjectId, selectedContactId, directThreads[selectedContactId]);
    }
  }, [activePanel, directThreads, selectedContactId, selectedProjectId, user.id]);

  useEffect(() => {
    const tourKey = `ttm_tour_seen_${user.id}`;
    if (!localStorage.getItem(tourKey)) {
      setShowTour(true);
    }
  }, [user.id]);

  useEffect(() => {
    window.history.pushState({ workspaceGuard: true }, "", window.location.href);

    function handlePopState() {
      window.history.pushState({ workspaceGuard: true }, "", window.location.href);
      setShowLogoutPrompt(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, projectsResponse] = await Promise.all([
        api.get("/dashboard/overview"),
        api.get("/projects")
      ]);

      setDashboard(dashboardResponse.data);
      setProjects(projectsResponse.data);
      if (projectsResponse.data.length > 0) {
        setSelectedProjectId((currentProjectId) => currentProjectId || projectsResponse.data[0].id);
      }
    } catch (loadError) {
      handleUnauthorized(loadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectDetails(projectId) {
    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`)
      ]);
      setSelectedProject(projectResponse.data);
      setTasks(tasksResponse.data);
      setSelectedTask((currentTask) => {
        if (!tasksResponse.data.length) {
          return null;
        }
        if (currentTask) {
          return tasksResponse.data.find((task) => task.id === currentTask.id) || tasksResponse.data[0];
        }
        return tasksResponse.data[0];
      });
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load project details");
    }
  }

  async function loadTaskComments(taskId) {
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      setTaskComments(data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load task comments");
    }
  }

  async function loadProjectMessages(projectId) {
    try {
      const { data } = await api.get(`/projects/${projectId}/messages`);
      setProjectMessages(data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load team messages");
    }
  }

  async function loadDirectMessages(projectId, contactId) {
    try {
      const { data } = await api.get(`/projects/${projectId}/direct-messages/${contactId}`);
      setDirectMessages(data);
      setDirectThreads((current) => ({ ...current, [contactId]: data }));
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load direct messages");
    }
  }

  async function loadAllDirectThreads(projectId, contacts) {
    try {
      const responses = await Promise.all(
        contacts.map(async (contact) => {
          const { data } = await api.get(`/projects/${projectId}/direct-messages/${contact.id}`);
          return [contact.id, data];
        })
      );
      setDirectThreads(Object.fromEntries(responses));
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load direct messages");
    }
  }

  function handleUnauthorized(requestError) {
    if (requestError.response?.status === 401 || requestError.response?.status === 403) {
      clearSession();
      navigate("/auth");
      return;
    }
    setError(requestError.response?.data?.message || "Something went wrong");
  }

  async function createProject(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/projects", projectForm);
      setProjectForm(defaultProjectForm);
      setMessage("Project created successfully");
      await loadInitialData();
      setActivePanel("projects");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create project");
    }
  }

  async function addMember(event) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await api.post(`/projects/${selectedProjectId}/team-members`, { email: memberEmail.trim() });
      setMemberEmail("");
      setMessage("Team member added successfully");
      await loadProjectDetails(selectedProjectId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add member");
    }
  }

  async function createTask(event) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await api.post(`/projects/${selectedProjectId}/tasks`, {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null,
        parentTaskId: taskForm.parentTaskId ? Number(taskForm.parentTaskId) : null
      });
      setTaskForm(defaultTaskForm);
      setMessage(user.role === "TEAM_LEAD" ? "Chunk created successfully" : "Task created successfully");
      await Promise.all([loadProjectDetails(selectedProjectId), loadInitialData()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create task");
    }
  }

  async function updateTaskStatus(task, status) {
    setMessage("");
    setError("");
    try {
      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        parentTaskId: task.parentTaskId
      });
      setMessage("Task updated successfully");
      await Promise.all([loadProjectDetails(selectedProjectId), loadInitialData()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update task");
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!selectedTask) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await api.post(`/tasks/${selectedTask.id}/comments`, { content: commentForm.trim() });
      setCommentForm("");
      await loadTaskComments(selectedTask.id);
      setMessage("Comment added successfully");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add comment");
    }
  }

  async function sendProjectMessage(event) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await api.post(`/projects/${selectedProjectId}/messages`, { content: messageForm.trim() });
      setMessageForm("");
      await loadProjectMessages(selectedProjectId);
      markChannelAsRead(user.id, selectedProjectId, projectMessages);
      setMessage("Team channel updated");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send message");
    }
  }

  async function sendDirectMessage(event) {
    event.preventDefault();
    if (!selectedContactId || !selectedProjectId) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await api.post(`/projects/${selectedProjectId}/direct-messages/${selectedContactId}`, { content: directMessageForm.trim() });
      setDirectMessageForm("");
      await loadDirectMessages(selectedProjectId, selectedContactId);
      markDirectAsRead(user.id, selectedProjectId, selectedContactId, directThreads[selectedContactId] || []);
      setMessage("Direct message sent");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send direct message");
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/auth");
  }

  function canUpdateTask(task) {
    return canPlanTasks || task.assigneeId === user.id;
  }

  function finishTour() {
    localStorage.setItem(`ttm_tour_seen_${user.id}`, "true");
    setShowTour(false);
    setTourStep(0);
  }

  function handlePanelChange(panelKey) {
    if (panelKey === "create" && !canCreateProjects) {
      return;
    }
    setActivePanel(panelKey);
    if (!sidebarExpanded) {
      setSidebarExpanded(true);
    }
  }

  function openTask(task) {
    setSelectedProjectId(task.projectId || selectedProjectId);
    setSelectedTask(task);
  }

  if (loading) {
    return <div className="loading-state">Loading workspace...</div>;
  }

  return (
    <div className={sidebarExpanded ? "dashboard-shell jira-shell nav-open" : "dashboard-shell jira-shell nav-collapsed"}>
      <aside className="workspace-nav">
        <div className="nav-brand">
          <div>
            <p className="eyebrow">Ethara Workspace</p>
            {sidebarExpanded ? <h2>Delivery Hub</h2> : null}
          </div>
          <button className="nav-toggle" onClick={() => setSidebarExpanded((open) => !open)} type="button">
            {sidebarExpanded ? "<<" : ">>"}
          </button>
        </div>

        <div className="nav-items">
          {navItems.map((item) => {
            if (item.key === "create" && !canCreateProjects) {
              return null;
            }

            return (
              <button
                key={item.key}
                className={activePanel === item.key ? "nav-item active" : "nav-item"}
                onClick={() => handlePanelChange(item.key)}
                type="button"
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarExpanded ? <span className="nav-label">{item.label}</span> : null}
                {sidebarExpanded && getNavUnreadCount(item.key, channelUnreadCount, directUnreadCount) > 0 ? (
                  <span className="nav-count">{getNavUnreadCount(item.key, channelUnreadCount, directUnreadCount)}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {sidebarExpanded ? (
          <div className="nav-drawer">
            {renderDrawer({
              activePanel,
              projects,
              selectedProjectId,
              setSelectedProjectId,
              projectMembers,
              directContacts,
              selectedContactId,
              setSelectedContactId,
              memberEmail,
              setMemberEmail,
              addMember,
              taskForm,
              setTaskForm,
              createTask,
              projectForm,
              setProjectForm,
              createProject,
              canCreateProjects,
              canPlanTasks,
              user,
              roleLabels,
              taskAssigneeOptions,
              teamLeadParentOptions,
              selectedProject
            })}
          </div>
        ) : null}
      </aside>

      <main className="workspace-main surface-panel">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Task command center</p>
            <h1>{user.name}</h1>
            <span className="subtle-copy">{roleLabels[user.role]} | {user.email}</span>
          </div>

          <div className="toolbar-actions">
            <button className="ghost-button" onClick={() => setShowTour(true)} type="button">Guide tour</button>
            <button className="theme-toggle" onClick={onToggleTheme} type="button">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button className="danger-button" onClick={() => setShowLogoutPrompt(true)} type="button">Logout</button>
          </div>
        </header>

        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}

        <section className="stats-grid">
          <StatCard label="Projects" value={dashboard?.totalProjects || 0} />
          <StatCard label="Total tasks" value={dashboard?.totalTasks || 0} />
          <StatCard label="In progress" value={dashboard?.inProgressTasks || 0} />
          <StatCard label="Overdue" value={dashboard?.overdueTasks || 0} accent="danger" />
        </section>

        {selectedProject ? (
          <div className="workspace-content">
            <section className="panel board-panel">
              <div className="board-header">
                <div>
                  <h2>{selectedProject.name}</h2>
                  <p>{selectedProject.description}</p>
                </div>
                <div className="board-meta">
                  <span className="tag">PM: {selectedProject.ownerName}</span>
                  <span className="tag">Due {selectedProject.dueDate}</span>
                </div>
              </div>

              <div className="member-strip">
                {projectMembers.map((member) => (
                  <div key={member.id} className="profile-chip">
                    <div className="profile-avatar">{getInitials(member.name)}</div>
                    <div className="profile-meta">
                      <strong>{member.name}</strong>
                      <span>{roleLabels[member.role]}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="project-insights">
                <InsightCard label="Project Manager" person={projectManager} />
                <InsightStack label="Team Leads" people={teamLeads} />
                <InsightStack label="Co-workers" people={coworkers} />
              </div>

              <div className="board-guidance">
                {user.role === "PROJECT_MANAGER"
                  ? "PM board shows the top-level assignments given to team leads. Their chunk progress rolls up automatically."
                  : null}
                {user.role === "TEAM_LEAD"
                  ? "Lead board shows parent tasks assigned to you. Open one to review the employee chunks underneath it."
                  : null}
                {user.role === "EMPLOYEE"
                  ? "Your board shows the chunks assigned to you. Updating status here will refresh the team lead and PM tracking."
                  : null}
              </div>

              <div className="kanban-grid">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                  <div key={status} className="kanban-column">
                    <div className="kanban-title">
                      <h3>{formatStatus(status)}</h3>
                      <span>{statusTasks.length}</span>
                    </div>

                    {statusTasks.length === 0 ? <p className="subtle-copy">No tasks in this lane.</p> : null}

                    {statusTasks.map((task) => (
                      <article
                        key={task.id}
                        className={selectedTask?.id === task.id ? "task-card selected" : "task-card"}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-card-header">
                          <strong>{task.title}</strong>
                          <span className={`status-pill ${task.status.toLowerCase()}`}>{formatStatus(task.status)}</span>
                        </div>
                        <p>{task.description}</p>
                        <small>Assignee: {task.assigneeName} | Due {task.dueDate}</small>
                        <small>Created by: {task.createdByName}</small>
                        {task.parentTaskTitle ? <small>Parent task: {task.parentTaskTitle}</small> : null}
                        {task.childTaskCount > 0 ? (
                          <small>Chunks completed: {task.completedChildTaskCount}/{task.childTaskCount}</small>
                        ) : null}
                        {canUpdateTask(task) ? (
                          <div className="status-actions">
                            <button onClick={(event) => { event.stopPropagation(); void updateTaskStatus(task, "TODO"); }} type="button">Todo</button>
                            <button onClick={(event) => { event.stopPropagation(); void updateTaskStatus(task, "IN_PROGRESS"); }} type="button">In progress</button>
                            <button onClick={(event) => { event.stopPropagation(); void updateTaskStatus(task, "DONE"); }} type="button">Done</button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <aside className="workspace-rail">
              {selectedTask ? (
                <section className="panel rail-section">
                  <div className="panel-title-row">
                    <h3>Task details</h3>
                    <span>{formatStatus(selectedTask.status)}</span>
                  </div>
                  <div className="detail-card">
                    <strong>{selectedTask.title}</strong>
                    <p className="subtle-copy">{selectedTask.description}</p>
                    <small>Assignee: {selectedTask.assigneeName}</small>
                    <small>Created by: {selectedTask.createdByName}</small>
                    <small>Due {selectedTask.dueDate}</small>
                    {selectedTask.parentTaskTitle ? <small>Parent task: {selectedTask.parentTaskTitle}</small> : null}
                    {selectedTask.childTaskCount > 0 ? (
                      <small>Chunk progress: {selectedTask.completedChildTaskCount}/{selectedTask.childTaskCount} complete</small>
                    ) : null}
                  </div>

                  {selectedTaskChildren.length ? (
                    <>
                      <div className="panel-title-row">
                        <h3>Assigned chunks</h3>
                        <span>{selectedTaskChildren.length}</span>
                      </div>
                      <div className="comment-list">
                        {selectedTaskChildren.map((childTask) => (
                          <button key={childTask.id} className="personal-task interactive-row" onClick={() => setSelectedTask(childTask)} type="button">
                            <strong>{childTask.title}</strong>
                            <span>{childTask.assigneeName}</span>
                            <small>{formatStatus(childTask.status)} | Due {childTask.dueDate}</small>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <div className="panel-title-row">
                    <h3>Task comments</h3>
                    <span>{taskComments.length}</span>
                  </div>
                  <div className="comment-list">
                    {taskComments.map((comment) => (
                      <MessageCard
                        key={comment.id}
                        initials={getInitials(comment.authorName)}
                        name={comment.authorName}
                        role={roleLabels[comment.authorRole]}
                        content={comment.content}
                      />
                    ))}
                    {!taskComments.length ? <p className="subtle-copy">No comments yet for this task.</p> : null}
                  </div>

                  {(canPlanTasks || selectedTask.assigneeId === user.id) ? (
                    <form className="form-card compact workspace-form" onSubmit={addComment}>
                      <label>
                        Add comment
                        <textarea
                          value={commentForm}
                          onChange={(event) => setCommentForm(event.target.value)}
                          placeholder="Add progress notes, blockers, or handoff details"
                        />
                      </label>
                      <button className="ghost-button" type="submit">Post comment</button>
                    </form>
                  ) : null}
                </section>
              ) : null}

              {activePanel === "team" ? (
                <section className="panel rail-section">
                  <div className="panel-title-row">
                    <h3>Team channel</h3>
                    <span>{projectMessages.length}</span>
                  </div>
                  <div className="comment-list">
                    {projectMessages.map((messageItem) => (
                      <MessageCard
                        key={messageItem.id}
                        initials={getInitials(messageItem.senderName)}
                        name={messageItem.senderName}
                        role={roleLabels[messageItem.senderRole]}
                        content={messageItem.content}
                      />
                    ))}
                    {!projectMessages.length ? <p className="subtle-copy">No messages yet in this project channel.</p> : null}
                  </div>
                  <form className="form-card compact workspace-form" onSubmit={sendProjectMessage}>
                    <label>
                      Message team
                      <textarea
                        value={messageForm}
                        onChange={(event) => setMessageForm(event.target.value)}
                        placeholder="Share an update, blocker, or coordination note"
                      />
                    </label>
                    <button className="primary-button" type="submit">Send message</button>
                  </form>
                </section>
              ) : null}

              {activePanel === "direct" ? (
                <section className="panel rail-section">
                  <div className="panel-title-row">
                    <h3>Direct messaging</h3>
                    <span>{selectedContact ? selectedContact.name : "No contact"}</span>
                  </div>

                  <div className="contact-pills">
                    {directContacts.map((contact) => (
                      <button
                        key={contact.id}
                        className={selectedContactId === contact.id ? "contact-pill active" : "contact-pill"}
                        onClick={() => setSelectedContactId(contact.id)}
                        type="button"
                      >
                        <span className="profile-avatar tiny">{getInitials(contact.name)}</span>
                        <span>{contact.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="comment-list direct-thread">
                    {directMessages.map((directMessage) => (
                      <div
                        key={directMessage.id}
                        className={directMessage.senderId === user.id ? "message-bubble mine" : "message-bubble"}
                      >
                        <small>{directMessage.senderName}</small>
                        <p>{directMessage.content}</p>
                      </div>
                    ))}
                    {!directMessages.length ? <p className="subtle-copy">No direct messages in this project conversation yet.</p> : null}
                  </div>

                  <form className="form-card compact workspace-form" onSubmit={sendDirectMessage}>
                    <label>
                      Message individual
                      <textarea
                        value={directMessageForm}
                        onChange={(event) => setDirectMessageForm(event.target.value)}
                        placeholder="Send a private note to the selected team member"
                      />
                    </label>
                    <button className="ghost-button" type="submit" disabled={!selectedContactId}>Send direct message</button>
                  </form>
                </section>
              ) : null}

              <section className="panel rail-section">
                <div className="panel-title-row">
                  <h3>My assigned tasks</h3>
                  <span>{dashboard?.myTasks?.length || 0}</span>
                </div>
                {dashboard?.myTasks?.map((task) => (
                  <button key={task.id} className="personal-task interactive-row" onClick={() => openTask(task)} type="button">
                    <strong>{task.title}</strong>
                    <span>{task.projectName}</span>
                    <small>{formatStatus(task.status)} | Due {task.dueDate}</small>
                  </button>
                ))}
                {!dashboard?.myTasks?.length ? <p className="subtle-copy">Assigned tasks will appear here for quick follow-up.</p> : null}
              </section>
            </aside>
          </div>
        ) : (
          <section className="panel empty-state">
            <h2>No project selected</h2>
            <p>Create or join a project to start planning and tracking work.</p>
          </section>
        )}
      </main>

      {showLogoutPrompt ? (
        <ModalShell>
          <div className="modal-card smooth-pop">
            <p className="eyebrow">Leave workspace</p>
            <h3>Back navigation is protected while you are inside the workspace.</h3>
            <p className="subtle-copy">If you want to exit this session, choose logout. If you want to stay and continue working, choose cancel.</p>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setShowLogoutPrompt(false)} type="button">Cancel</button>
              <button className="danger-button" onClick={handleLogout} type="button">Logout</button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {showTour ? (
        <ModalShell>
          <div className="modal-card tour-card smooth-pop">
            <p className="eyebrow">Product tour</p>
            <h3>{tourSteps[tourStep].title}</h3>
            <p className="subtle-copy">{tourSteps[tourStep].description}</p>
            <div className="tour-progress">
              {tourSteps.map((step, index) => (
                <span key={step.title} className={index === tourStep ? "tour-dot active" : "tour-dot"} />
              ))}
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={finishTour} type="button">Skip</button>
              <div className="tour-controls">
                <button
                  className="ghost-button"
                  disabled={tourStep === 0}
                  onClick={() => setTourStep((currentStep) => currentStep - 1)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (tourStep === tourSteps.length - 1) {
                      finishTour();
                    } else {
                      setTourStep((currentStep) => currentStep + 1);
                    }
                  }}
                  type="button"
                >
                  {tourStep === tourSteps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function renderDrawer({
  activePanel,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  projectMembers,
  directContacts,
  selectedContactId,
  setSelectedContactId,
  memberEmail,
  setMemberEmail,
  addMember,
  taskForm,
  setTaskForm,
  createTask,
  projectForm,
  setProjectForm,
  createProject,
  canCreateProjects,
  canPlanTasks,
  user,
  roleLabels,
  taskAssigneeOptions,
  teamLeadParentOptions,
  selectedProject
}) {
  if (activePanel === "projects") {
    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>Project list</h3>
          <span>{projects.length}</span>
        </div>
        <div className="project-list compact-list">
          {projects.map((project) => (
            <button
              key={project.id}
              className={project.id === selectedProjectId ? "project-item active" : "project-item"}
              onClick={() => setSelectedProjectId(project.id)}
              type="button"
            >
              <strong>{project.name}</strong>
              <span>{project.ownerName}</span>
              <small>Due {project.dueDate}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === "members") {
    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>Add member</h3>
          <span>{canCreateProjects ? "PM" : "View"}</span>
        </div>
        <div className="mini-roster">
          {projectMembers.map((member) => (
            <div key={member.id} className="mini-roster-row">
              <span className="profile-avatar tiny">{getInitials(member.name)}</span>
              <div className="profile-meta">
                <strong>{member.name}</strong>
                <span>{roleLabels[member.role]}</span>
              </div>
            </div>
          ))}
        </div>
        {canCreateProjects ? (
          <form className="form-card compact workspace-form" onSubmit={addMember}>
            <label>
              Work email
              <input
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="teammate@company.com"
              />
            </label>
            <button className="primary-button" type="submit">Add to project</button>
          </form>
        ) : null}
      </div>
    );
  }

  if (activePanel === "tasks") {
    const planningLabel = user.role === "TEAM_LEAD" ? "Create chunk" : "Plan task";
    const planningHelp = user.role === "TEAM_LEAD"
      ? "Pick a parent task assigned to you, then assign each chunk to an employee."
      : "Create top-level work items and assign them to the responsible team lead.";

    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>{planningLabel}</h3>
          <span>{canPlanTasks ? "Allowed" : "View only"}</span>
        </div>
        <p className="subtle-copy">{planningHelp}</p>
        {canPlanTasks ? (
          <form className="form-card compact workspace-form" onSubmit={createTask}>
            <label>
              Title
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            {user.role === "TEAM_LEAD" ? (
              <label>
                Parent task
                <select
                  value={taskForm.parentTaskId}
                  onChange={(event) => setTaskForm((current) => ({ ...current, parentTaskId: event.target.value }))}
                >
                  <option value="">Select PM task</option>
                  {teamLeadParentOptions.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Status
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>
            <label>
              Assignee
              <select
                value={taskForm.assigneeId}
                onChange={(event) => setTaskForm((current) => ({ ...current, assigneeId: event.target.value }))}
              >
                <option value="">{user.role === "PROJECT_MANAGER" ? "Unassigned" : "Select employee"}</option>
                {taskAssigneeOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({roleLabels[member.role]})
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              {user.role === "TEAM_LEAD" ? "Save chunk" : "Save task"}
            </button>
          </form>
        ) : <p className="subtle-copy">Task planning belongs to the project manager and team leads.</p>}
      </div>
    );
  }

  if (activePanel === "team") {
    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>Channel view</h3>
          <span>{selectedProject ? selectedProject.name : "No project"}</span>
        </div>
        <p className="subtle-copy">The right panel now opens only the team channel you selected here, so the board stays cleaner.</p>
      </div>
    );
  }

  if (activePanel === "direct") {
    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>Direct contacts</h3>
          <span>{directContacts.length}</span>
        </div>
        <div className="mini-roster">
          {directContacts.map((contact) => (
            <button
              key={contact.id}
              className={selectedContactId === contact.id ? "contact-list-item active" : "contact-list-item"}
              onClick={() => setSelectedContactId(contact.id)}
              type="button"
            >
              <span className="profile-avatar tiny">{getInitials(contact.name)}</span>
              <div className="profile-meta">
                <strong>{contact.name}</strong>
                <span>{roleLabels[contact.role]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === "create") {
    return (
      <div className="drawer-section">
        <div className="drawer-title">
          <h3>New project</h3>
          <span>PM only</span>
        </div>
        {canCreateProjects ? (
          <form className="form-card compact workspace-form" onSubmit={createProject}>
            <label>
              Project name
              <input
                value={projectForm.name}
                onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                value={projectForm.description}
                onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={projectForm.dueDate}
                onChange={(event) => setProjectForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>
            <button className="primary-button" type="submit">Create project</button>
          </form>
        ) : null}
      </div>
    );
  }

  return null;
}

function InsightCard({ label, person }) {
  return (
    <div className="insight-card">
      <span className="insight-label">{label}</span>
      {person ? (
        <div className="insight-person">
          <div className="profile-avatar">{getInitials(person.name)}</div>
          <div className="profile-meta">
            <strong>{person.name}</strong>
            <span>{person.email}</span>
          </div>
        </div>
      ) : <p className="subtle-copy">No one assigned yet.</p>}
    </div>
  );
}

function InsightStack({ label, people }) {
  return (
    <div className="insight-card">
      <span className="insight-label">{label}</span>
      <div className="stack-list">
        {people.length ? people.map((person) => (
          <div key={person.id} className="insight-person compact-person">
            <div className="profile-avatar">{getInitials(person.name)}</div>
            <div className="profile-meta">
              <strong>{person.name}</strong>
              <span>{person.email}</span>
            </div>
          </div>
        )) : <p className="subtle-copy">No one assigned yet.</p>}
      </div>
    </div>
  );
}

function MessageCard({ initials, name, role, content }) {
  return (
    <div className="comment-card">
      <div className="comment-head">
        <div className="profile-avatar small">{initials}</div>
        <div className="profile-meta">
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
      <p>{content}</p>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ModalShell({ children }) {
  return <div className="modal-overlay">{children}</div>;
}

function getNavUnreadCount(panelKey, channelUnreadCount, directUnreadCount) {
  if (panelKey === "team") {
    return channelUnreadCount;
  }
  if (panelKey === "direct") {
    return directUnreadCount;
  }
  return 0;
}

function getChannelReadKey(userId, projectId) {
  return `ttm_channel_read_${userId}_${projectId}`;
}

function getDirectReadKey(userId, projectId, contactId) {
  return `ttm_direct_read_${userId}_${projectId}_${contactId}`;
}

function markChannelAsRead(userId, projectId, messages) {
  const latestTimestamp = getLatestIncomingTimestamp(messages);
  if (projectId && latestTimestamp) {
    localStorage.setItem(getChannelReadKey(userId, projectId), latestTimestamp);
  }
}

function markDirectAsRead(userId, projectId, contactId, messages) {
  const latestTimestamp = getLatestIncomingTimestamp(messages);
  if (projectId && contactId && latestTimestamp) {
    localStorage.setItem(getDirectReadKey(userId, projectId, contactId), latestTimestamp);
  }
}

function getUnreadChannelCount(messages, currentUserId, projectId) {
  if (!projectId) {
    return 0;
  }
  const lastSeen = localStorage.getItem(getChannelReadKey(currentUserId, projectId));
  return messages.filter((message) => isUnreadIncomingMessage(message, currentUserId, lastSeen)).length;
}

function getUnreadDirectCount(messages, currentUserId, projectId, contactId) {
  if (!projectId || !contactId) {
    return 0;
  }
  const lastSeen = localStorage.getItem(getDirectReadKey(currentUserId, projectId, contactId));
  return messages.filter((message) => isUnreadIncomingMessage(message, currentUserId, lastSeen)).length;
}

function getLatestIncomingTimestamp(messages) {
  if (!messages.length) {
    return null;
  }
  return messages[messages.length - 1].createdAt;
}

function isUnreadIncomingMessage(message, currentUserId, lastSeen) {
  if (!message?.createdAt || message.senderId === currentUserId) {
    return false;
  }
  return !lastSeen || new Date(message.createdAt) > new Date(lastSeen);
}

function formatStatus(status) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
