class TasksServer {
    static handleRequest(method, url, body) {
        const username = sessionStorage.getItem("currentUser");
        if (!username) return { status: 401, message: "Unauthorized!", data: null };

        // GET /tasks - Getting all the tasks.
        if (method === "GET" && url === "/tasks") {
            return { status: 200, message: "Tasks retrieved successfully", data: DBAPI.Tasks.getAll(username) };
        }

        // POST /tasks - Adding a new task.
        if (method === "POST" && url === "/tasks") {
            return DBAPI.Tasks.create(username, JSON.parse(body));
        }

        // PUT /tasks/id - update existing task
        if (method === "PUT" && url.match(/^\/tasks\/\d+$/)) {
            const taskId = parseInt(url.split("/")[2]);
            
            let obj;

            if (typeof body === 'string') {
                obj = JSON.parse(body); 
            } else {
                obj = body; 
            }

            const updatedTask = obj;
            
            return DBAPI.Tasks.update(username, taskId, updatedTask);
        }

        // DELETE /tasks/id - delete task
        if (method === "DELETE" && url.match(/^\/tasks\/\d+$/)) {
            const taskId = parseInt(url.split("/")[2]);
            return DBAPI.Tasks.delete(username, taskId);
        }

        // POST /tasks/id/complete 
        if (method === "POST" && url.match(/^\/tasks\/\d+\/complete$/)) {
            const taskId = parseInt(url.split("/")[2]);
            return DBAPI.Tasks.complete(username, taskId);
        }

        // POST /tasks/id/uncomplete 
        if (method === "POST" && url.match(/^\/tasks\/\d+\/uncomplete$/)) {
            const taskId = parseInt(url.split("/")[2]);
            return DBAPI.Tasks.uncomplete(username, taskId);
        }

        // PUT /tasks/id/deadline - Updating the deadline of a task.
        if (method === "PUT" && url.match(/^\/tasks\/\d+\/deadline$/)) {
            const taskId = parseInt(url.split("/")[2]);
            const deadlineData = JSON.parse(body);
            return DBAPI.Tasks.setDeadline(username, taskId, deadlineData.deadline);
        }

        // DELETE /tasks/id/deadline - delete deadline
        if (method === "DELETE" && url.match(/^\/tasks\/\d+\/deadline$/)) {
            const taskId = parseInt(url.split("/")[2]);
            return DBAPI.Tasks.removeDeadline(username, taskId);
        }

        // POST /tasks/clear-completed - Clearing completed tasks.
        if (method === "POST" && url === "/tasks/clear-completed") {
            return DBAPI.Tasks.clearCompleted(username);
        }

        // GET /tasks/stats - Getting statistics on the tasks.
        if (method === "GET" && url === "/tasks/stats") {
            return { status: 200, message: "Task statistics retrieved", data: DBAPI.Tasks.getStats(username) };
        }

        // GET /tasks/search?query=... - Searching for tasks.
        if (method === "GET" && url.startsWith("/tasks/search")) {
            const query = url.split("?query=")[1] || "";
            console.log(query);
            return DBAPI.Tasks.search(username, decodeURIComponent(query));
        }

        // GET /tasks/sort?sortBy=...&order=... - Sorting tasks.
        if (method === "GET" && url.startsWith("/tasks/sort")) {
            const params = new URLSearchParams(url.split("?")[1]);
            const sortBy = params.get("sortBy") || "createdAt";
            const order = params.get("order") || "asc";
            return DBAPI.Tasks.sort(username, sortBy, order);
        }

        // POST /tasks/filter - Filtering tasks.
        if (method === "POST" && url === "/tasks/filter") {
            const filterParams = JSON.parse(body);
            return DBAPI.Tasks.filter(username, filterParams);
        }

        return { status: 404, message: "Tasks API route not found!", data: null };
    }
}