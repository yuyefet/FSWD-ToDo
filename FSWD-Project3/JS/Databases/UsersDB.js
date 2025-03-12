class UsersDB {
    // Retrieving all users from `localStorage`.
    static getUsers() {
        return JSON.parse(localStorage.getItem("users") || "{}");
    }

    // Saving all users to `localStorage`.
    static setUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    // Registering a new user.
    static registerUser(fullname, username, email, password) {
        // Retrieving existing users.
        const users = this.getUsers();
        
        // Checking if the user already exists.
        if (users[username]) {
            console.log(`User ${username} already exists`);
            return { 
                status: 409, 
                message: "Username already exists.",
                data: null
            };
        }
        
        // Creating a unique identifier for the user.
        const userId = Date.now() + Math.floor(Math.random() * 1000);
        
        // Creating a new user record.
        users[username] = {
            id: userId,
            fullname,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        // Saving the updated users.
        this.setUsers(users);
        console.log(`User ${username} registered successfully with ID ${userId}`);
        
        // Creating empty tasks for the new user.
        TasksDB.createUserTasks(userId);
        
        return {
            status: 201,
            message: "User has been successfully registered",
            data: {
                id: userId,
                username: username
            }
        };
    }

    // User login.
    static loginUser(username, password) {
        const users = this.getUsers();
        
        // Checking if the user exists.
        if (!users[username]) {
            console.log(`User ${username} does not exist`);
            return {
                status: 404,
                message: "The username does not exist in the system.",
                errorType: "username_not_found",
                data: null
            };
        }
        
        // Checking if the password is correct.
        if (users[username].password !== password) {
            console.log(`Incorrect password for user ${username}`);
            return {
                status: 401,
                message: "The password you entered is incorrect.",
                errorType: "incorrect_password",
                data: null
            };
        }
        
        sessionStorage.setItem("currentUser", username);
        sessionStorage.setItem("currentUserId", users[username].id);
        
        console.log(`User ${username} logged in successfully`);
        return {
            status: 200,
            message: "The login was successful.",
            data: {
                id: users[username].id,
                username: username
            }
        };
    }

    // Logout.
    static logoutUser() {
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("currentUserId");
        console.log("User logged out");
        return {
            status: 200,
            message: "The logout was successful.",
            data: null
        };
    }

    // Retrieving the details of the currently logged-in user.
    static getCurrentUser() {
        const username = sessionStorage.getItem("currentUser");
        const userId = sessionStorage.getItem("currentUserId");
        
        if (!username || !userId) {
            console.log("No user is currently logged in");
            return null;
        }
        return {
            id: userId,
            username: username
        };
    }

    // Get user by ID
    static getUserById(userId) {
        const users = this.getUsers();
        
        for (const username in users) {
            if (users[username].id === userId) {
                // Return a copy without the password
                const userCopy = { ...users[username] };
                delete userCopy.password;
                return userCopy;
            }
        }
        
        console.log(`User with ID ${userId} not found`);
        return null;
    }
}
