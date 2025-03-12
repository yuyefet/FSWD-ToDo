class UsersServer {
    static handleRequest(method, url, body) {
        console.log(`UsersServer: handleRequest called with method=${method}, url=${url}`);
        
        if (method === "POST" && url === "/users/register") {
            const userData = JSON.parse(body);
            console.log("UsersServer: Register request", userData);
            return DBAPI.Users.create(userData);
        }

        if (method === "POST" && url === "/users/login") {
            const { username, password } = JSON.parse(body);
            return DBAPI.Users.authenticate(username, password);
        }

        if (method === "POST" && url === "/users/logout") {
            return DBAPI.Users.logout();
        }

        if (method === "GET" && url === "/users/me") {
            const currentUser = UsersDB.getCurrentUser();
            if (!currentUser) return { status: 401, message: "Not logged in", data: null };
            return { status: 200, message: "Current user retrieved", data: currentUser };
        }

        return { status: 404, message: "Users API route not found!", data: null };
    }
}