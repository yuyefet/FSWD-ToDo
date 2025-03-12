class TasksDB {
    // Creating a task repository for a new user.
    static createUserTasks(userId) {
        const tasksDB = JSON.parse(localStorage.getItem("tasks")) || {};
        tasksDB[userId] = []; 
        localStorage.setItem("tasks", JSON.stringify(tasksDB));
    }

    // Basic functions for retrieving information.
    static getUserIdByUsername(username) {
        const users = JSON.parse(localStorage.getItem("users")) || {};
        return users[username]?.id;
    }

    static getTasks(username) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return [];
        return this.getTasksByUserId(userId);
    }

    static getTasksByUserId(userId) {
        const tasksDB = JSON.parse(localStorage.getItem("tasks")) || {};
        const tasks = tasksDB[userId] || [];
        
        // Checking delayed tasks and updating status.
        return this._updateTasksOverdueStatus(tasks);
    }

    static setTasksByUserId(userId, tasks) {
        const tasksDB = JSON.parse(localStorage.getItem("tasks")) || {};
        tasksDB[userId] = tasks;
        localStorage.setItem("tasks", JSON.stringify(tasksDB));
    }

    static getTaskById(username, taskId) {
        const tasks = this.getTasks(username);
        return tasks.find(task => task.id === taskId);
    }

    // Adding a new task.
    static addTask(username, task) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: null };
        
        const tasks = this.getTasksByUserId(userId);
        
        // Basic validation.
        if (!task.title || task.title.trim() === "") {
            return { status: 400, message: "Task title is required!", data: null };
        }
        
        // Adding a unique identifier and additional fields.
        const newTask = this._prepareNewTask(task);
        
        tasks.push(newTask);
        this.setTasksByUserId(userId, tasks);
        return { status: 201, message: "Task added successfully!", data: newTask };
    }

    // Update task - central function.
    static updateTask(username, taskId, updatedData) {
        
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: null };
        
        const tasks = this.getTasksByUserId(userId);
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index === -1) {
            return { status: 404, message: "Task not found!", data: null };
        }
        
        // Creating a copy of the original task.
        const originalTask = tasks[index];
        
        // Creating a copy of the updated task with a combination of existing and new data.
        let updatedTask = { ...originalTask };
        
        // Updating the fields that were passed.
        Object.keys(updatedData).forEach(key => {
            // Copying all the fields that were passed, except for special fields that are handled separately.
            if (key !== 'id' && key !== 'createdAt') {
                updatedTask[key] = updatedData[key];
            }
        });
        
        // Updating the last modified date.
        updatedTask.updatedAt = new Date().toISOString();
        
        // Handling the completion status.
        updatedTask = this._handleCompletionStatus(originalTask, updatedTask);
        
        // Handling the deadline and delay status.
        updatedTask = this._handleDeadlineStatus(updatedTask);
        
        // Saving the updated task.
        tasks[index] = updatedTask;
        this.setTasksByUserId(userId, tasks);
        
        return { status: 200, message: "Task updated successfully!", data: updatedTask };
    }

    // Deleting a task.
    static deleteTask(username, taskId) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: null };
        
        const tasks = this.getTasksByUserId(userId);
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index === -1) {
            return { status: 404, message: "Task not found!", data: null };
        }
        
        const deletedTask = tasks[index];
        tasks.splice(index, 1);
        this.setTasksByUserId(userId, tasks);
        return { status: 200, message: "Task deleted successfully!", data: deletedTask };
    }

    // Interface functions for specific actions (calling the `updateTask` function).
    static completeTask(username, taskId) {
        return this.updateTask(username, taskId, { completed: true });
    }

    static uncompleteTask(username, taskId) {
        return this.updateTask(username, taskId, { completed: false });
    }

    static setTaskDeadline(username, taskId, deadline) {
        if (!deadline) {
            return { status: 400, message: "Deadline is required!", data: null };
        }
        
        try {
            // Checking that the deadline is a valid date.
            const deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return { status: 400, message: "Invalid deadline date format!", data: null };
            }
            
            return this.updateTask(username, taskId, { deadline });
        } catch (error) {
            return { status: 400, message: "Error setting deadline: " + error.message, data: null };
        }
    }

    static removeTaskDeadline(username, taskId) {
        // This helper function will return an object with `deadline: null`, which will cause the field to be deleted.
        return this.updateTask(username, taskId, { deadline: null });
    }

    // Task search.
    static searchTasks(username, query) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: [] };
        
        const tasks = this.getTasksByUserId(userId);
        
        if (!query || query.trim() === "") {
            return { status: 200, message: "All tasks retrieved", data: tasks };
        }
        
        const lowerQuery = query.toLowerCase();
        
        const results = tasks.filter(task => {
            return task.title.toLowerCase().includes(lowerQuery) || 
                  (task.description && task.description.toLowerCase().includes(lowerQuery));
        });
        
        return { status: 200, message: `Found ${results.length} matching tasks`, data: results };
    }

    // Sorting and filtering functions.
    static sortTasks(username, sortBy, order = 'asc') {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: [] };
        
        const tasks = this.getTasksByUserId(userId);
        
        // Parameter validation check.
        const validSortFields = ['createdAt', 'updatedAt', 'deadline', 'title', 'completed'];
        if (!validSortFields.includes(sortBy)) {
            return { status: 400, message: `Invalid sort field! Valid options are: ${validSortFields.join(', ')}`, data: [] };
        }
        
        if (order !== 'asc' && order !== 'desc') {
            return { status: 400, message: "Invalid sort order! Use 'asc' or 'desc'", data: [] };
        }
        
        // Copy the array to avoid modifying the original.
        const sortedTasks = [...tasks];
        
        sortedTasks.sort((a, b) => {
            let result = 0;
            
            // Checking by which field to sort.
            if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'deadline') {
                // Sorting by date.
                const dateA = a[sortBy] ? new Date(a[sortBy]) : new Date(0);
                const dateB = b[sortBy] ? new Date(b[sortBy]) : new Date(0);
                result = dateA - dateB;
            } else if (sortBy === 'title') {
                // Sorting by title.
                result = (a.title || '').localeCompare(b.title || '');
            } else if (sortBy === 'completed') {
                // Sorting by completion status.
                result = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
            }
            
            // Reversing the order if necessary.
            return order === 'desc' ? -result : result;
        });
        
        return { status: 200, message: `Tasks sorted by ${sortBy} (${order})`, data: sortedTasks };
    }

    static filterTasks(username, filter) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: [] };
        
        const tasks = this.getTasksByUserId(userId);
        let filteredTasks = [...tasks];
        
        // Filtering by different criteria.
        if (filter.completed !== undefined) {
            filteredTasks = filteredTasks.filter(task => task.completed === filter.completed);
        }
        
        if (filter.overdue !== undefined) {
            filteredTasks = filteredTasks.filter(task => task.overdue === filter.overdue);
        }
        
        if (filter.createdFrom) {
            const fromDate = new Date(filter.createdFrom);
            filteredTasks = filteredTasks.filter(task => new Date(task.createdAt) >= fromDate);
        }
        
        if (filter.createdTo) {
            const toDate = new Date(filter.createdTo);
            filteredTasks = filteredTasks.filter(task => new Date(task.createdAt) <= toDate);
        }
        
        if (filter.deadlineFrom) {
            const fromDate = new Date(filter.deadlineFrom);
            filteredTasks = filteredTasks.filter(task => 
                task.deadline && new Date(task.deadline) >= fromDate
            );
        }
        
        if (filter.deadlineTo) {
            const toDate = new Date(filter.deadlineTo);
            filteredTasks = filteredTasks.filter(task => 
                task.deadline && new Date(task.deadline) <= toDate
            );
        }
        
        return { status: 200, message: `Found ${filteredTasks.length} tasks matching filters`, data: filteredTasks };
    }

    // Additional actions.
    static clearCompletedTasks(username) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: [] };
        
        const tasks = this.getTasksByUserId(userId);
        const completedCount = tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            return { status: 200, message: "No completed tasks to clear!", data: tasks };
        }
        
        const remainingTasks = tasks.filter(task => !task.completed);
        
        this.setTasksByUserId(userId, remainingTasks);
        return { 
            status: 200, 
            message: `${completedCount} completed tasks cleared!`, 
            data: remainingTasks 
        };
    }

    static getTasksStats(username) {
        const userId = this.getUserIdByUsername(username);
        if (!userId) return { status: 404, message: "User not found!", data: null };
        
        const tasks = this.getTasksByUserId(userId);
        
        const stats = {
            total: tasks.length,
            completed: tasks.filter(task => task.completed).length,
            active: tasks.filter(task => !task.completed).length,
            overdue: tasks.filter(task => task.overdue).length,
            withDeadline: tasks.filter(task => task.deadline).length
        };
        
        return { status: 200, message: "Task statistics retrieved successfully", data: stats };
    }

    // ================ Internal helper functions =================
    
    // Preparing a new task with all the required fields.
    static _prepareNewTask(taskData) {
        // Creating a copy of the task data.
        const newTask = { ...taskData };
        
        // Adding basic fields.
        newTask.id = Date.now() + Math.floor(Math.random() * 1000);
        const now = new Date().toISOString();
        newTask.createdAt = now;
        newTask.updatedAt = now;
        newTask.completed = false;
        newTask.overdue = false;
        
        // Checking if a deadline exists.
        if (newTask.deadline) {
            const deadlineDate = new Date(newTask.deadline);
            const currentDate = new Date();
            
            // If the deadline has passed, mark the task as delayed.
            if (deadlineDate < currentDate) {
                newTask.overdue = true;
            }
        }
        
        return newTask;
    }
    
    // Updating the delay status for all tasks.
    static _updateTasksOverdueStatus(tasks) {
        const now = new Date();
        
        return tasks.map(task => {
            // Creating a copy of the task.
            const updatedTask = { ...task };
            
            // Checking if there is a deadline and the task is not completed.
            if (task.deadline && !task.completed) {
                const deadlineDate = new Date(task.deadline);
                // Checking if the deadline has passed.
                updatedTask.overdue = deadlineDate < now;
            } else if (task.completed) {
                // A completed task cannot be delayed.
                updatedTask.overdue = false;
            }
            
            return updatedTask;
        });
    }
    
    // Handling the completion status of a task.
    static _handleCompletionStatus(originalTask, updatedTask) {
        // Checking if the completion status has changed.
        if (updatedTask.completed !== originalTask.completed) {
            if (updatedTask.completed) {
                // Changing the task status from incomplete to complete.
                updatedTask.completedAt = updatedTask.updatedAt;
                updatedTask.overdue = false; // A completed task cannot be delayed.
            } else {
                // Changing the task status from complete to incomplete.
                delete updatedTask.completedAt;
                
                // Checking if the task should be marked as delayed after canceling the completion.
                if (updatedTask.deadline) {
                    const deadlineDate = new Date(updatedTask.deadline);
                    const currentDate = new Date();
                    
                    updatedTask.overdue = deadlineDate < currentDate;
                }
            }
        }
        
        return updatedTask;
    }
    
    // Handling the deadline and delay status.
    static _handleDeadlineStatus(updatedTask) {
        // Handling the case of removing the deadline.
        if (updatedTask.deadline === null) {
            delete updatedTask.deadline;
            if (!updatedTask.completed) {
                updatedTask.overdue = false;
            }
            return updatedTask;
        }
        
        // Handling the case of updating the deadline.
        if (updatedTask.deadline && !updatedTask.completed) {
            const deadlineDate = new Date(updatedTask.deadline);
            const currentDate = new Date();
            
            // Updating the delay status according to the deadline.
            updatedTask.overdue = deadlineDate < currentDate;
        }
        
        return updatedTask;
    }
}
