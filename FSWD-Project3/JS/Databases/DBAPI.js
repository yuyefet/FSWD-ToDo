class DBAPI {
    // API for a user data repository.
    static Users = {
        getAll() {
            return UsersDB.getUsers();
        },
        
        getById(id) {
            const user = UsersDB.getUserById(id);
            if (!user) {
                return { status: 404, message: "User not found!", data: null };
            }
            return { status: 200, message: "User retrieved successfully", data: user };
        },
        
        getByUsername(username) {
            const users = UsersDB.getUsers();
            return users[username];
        },
        
        create(userData) {
            return UsersDB.registerUser(userData.fullname, userData.username, userData.email, userData.password);
        },
        
        authenticate(username, password) {
            return UsersDB.loginUser(username, password);
        },
        
        logout() {
            return UsersDB.logoutUser();
        }
    }
    
    // API for a task data repository.
    static Tasks = {
        getAll(username) {
            const tasks = TasksDB.getTasks(username);
            return tasks ;
        },
        
        getById(username, taskId) {
            const task = TasksDB.getTaskById(username, taskId);
            if (!task) {
                return { status: 404, message: "Task not found!", data: null };
            }
            return { status: 200, message: "Task retrieved successfully", data: task };
        },
        
        create(username, taskData) {
            return TasksDB.addTask(username, taskData);
        },
        
        update(username, taskId, taskData) {
            return TasksDB.updateTask(username, taskId, taskData);
        },
        
        delete(username, taskId) {
            return TasksDB.deleteTask(username, taskId);
        },
        
        complete(username, taskId) {
            return TasksDB.completeTask(username, taskId);
        },
        
        uncomplete(username, taskId) {
            return TasksDB.uncompleteTask(username, taskId);
        },
        
        setDeadline(username, taskId, deadline) {
            return TasksDB.setTaskDeadline(username, taskId, deadline);
        },
        
        removeDeadline(username, taskId) {
            return TasksDB.removeTaskDeadline(username, taskId);
        },
        
        search(username, query) {
            return TasksDB.searchTasks(username, query);
        },
        
        sort(username, sortBy, order) {
            return TasksDB.sortTasks(username, sortBy, order);
        },
        
        filter(username, filterParams) {
            return TasksDB.filterTasks(username, filterParams);
        },
        
        clearCompleted(username) {
            return TasksDB.clearCompletedTasks(username);
        },
        
        getStats(username) {
            return TasksDB.getTasksStats(username);
        }
    }
}
