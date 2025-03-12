// ClientSPA.js

const xhr = new FXMLHttpRequest();

// Load initial form
window.onload = function () {
    loadForm('login');
};

function loadForm(view) {
    const template = document.getElementById(`${view}-template`);
    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = '';
    formContainer.appendChild(template.content.cloneNode(true));

    const wrapper = document.querySelector('.wrapper');
    if (view === 'todo') {
        wrapper.classList.add('todo-active'); // Expand for To-Do
        displayAllTodos();
    } else {
        wrapper.classList.remove('todo-active'); // Reset size for login/register
    }

    // Re-attach event listeners when loading forms
    if (view === 'login') {
        attachLoginEvent();
    }
    else if (view === 'registration'){
        attachRegEvent();
    }

    history.pushState({ page: view }, `${view.charAt(0).toUpperCase() + view.slice(1)} Page`, `#${view}`);
}

// Event listener for popstate to manage browser navigation (back/forward)
window.onpopstate = function (event) {
    if (event.state) {
        loadForm(event.state.page);  // Load the page stored in the history state
    }
};


// Attach login form event listener dynamically
function attachLoginEvent() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent default form submission

            handleLogin((response, error) => {
                if (error) {
                    console.log("Login failed:", error);
                    alert(`Login failed: ${error}`);
                } else if (response){
                    console.log("Login successful! User data:", response);
                    loadForm('todo'); // Proceed after successful login
                }
            });
        });
    }
}

function attachRegEvent() {
    const RegForm = document.getElementById("registerForm");
    if (RegForm) {
        RegForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent default form submission

            handleRegistration((response, error) => {
                if (error) {
                    console.log("Registration failed:", error);
                    alert(`Registration failed: ${error}`);
                } else if(response){
                    console.log("Registration successful! User data:", response);
                    loadForm('login'); // Proceed after successful Registration
                }
            });
        });
    }
}
function usingMsg(callback) {
    if (xhr.readyState === 4) {            
        if (xhr.status.toString().startsWith("4")) {
            callback(null, JSON.parse(xhr.responseText).message) // Invoke callback with error
        } else if (xhr.status.toString().startsWith("5")){
            console.log("Networking Error")
            callback(null, "Networking Error") // Invoke callback with error
        }
        else {
            try {
                const response = JSON.parse(xhr.responseText); 
                console.log("Response:", response);
                //Success
                callback(JSON.parse(xhr.responseText).data.username, null); // Invoke callback with response
            } catch (e) {
                console.error("Error", e);
                callback(null, e); // Invoke callback with error
            }
        }
    }
}

function usingData(callback){
    if (xhr.readyState === 4) {            
        if (xhr.status.toString().startsWith("5")){
            //Networking Error
            callback(null, "Network Error") // Invoke callback with error
        }
        else {
            try {
                const response = JSON.parse(xhr.responseText); 
                console.log("Response:", response);
                //Success
                callback(JSON.parse(xhr.responseText).data, null); // Invoke callback with response
            } catch (e) {
                console.error("Error", e);
                callback(null, e); // Invoke callback with error
            }
        }
    }
}
// Handle Login
function handleLogin(callback) {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    xhr.onreadystatechange = function() { usingMsg(callback); }; 

    xhr.open("POST", "/users/login");
    const credentials = {
        username,
        password
    };
    xhr.send(JSON.stringify(credentials));
}

// Handle Registration
function handleRegistration(callback) {
    const fullname = document.getElementById('fullname').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return false;
    }

    // Email validation regex (checks for valid email format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return false;
    }
    
    xhr.onreadystatechange = function() { usingMsg(callback); }; 
    xhr.open("POST", "/users/register");
        
    const credentials = {
        fullname,
        username,
        email,
        password
    };
        
    xhr.send(JSON.stringify(credentials));
    
    return false;
}

// Add new To-Do
function addTodo() {
    const newTodo = document.getElementById('newTodo').value;
    document.getElementById('searchTodo').value = "";

    xhr.onreadystatechange = function() { usingMsg((response, error) => {
        if (error) {
            console.log("Action failed:", error);
            alert(error);
        } else{
            displayAllTodos();
        }
    }); }; 

    if (newTodo.trim() !== "") {
        xhr.open("POST", "/tasks");
        const task = {
            title: newTodo,
            deadline: ""
        };

        xhr.send(JSON.stringify(task));
        
        document.getElementById('newTodo').value = '';
    }
}

// Delete To-Do
function deleteTodo(todo) {
    xhr.onreadystatechange = function() { usingMsg((response, error) => {
        if (error) {
            console.log("Action failed:", error);
            alert("Action failed");
        } else{
            console.log("Action Succeed");
            displayAllTodos();
        }
    }); }; 

    xhr.open("DELETE", "/tasks/" + todo.id);
    xhr.send();
}

// Toggle To-Do status
function toggleTodoStatus(todo) {
    const completed = todo.completed;

    xhr.onreadystatechange = function() { usingMsg((response, error) => {
        if (error) {
            console.log("Action failed:", error);
            alert("Action failed");
        } else{
            console.log("Action Succeed");
            displayAllTodos();
        }
    }); }; 
    if (completed)
        xhr.open("POST", "/tasks/" + todo.id + "/uncomplete");
    else
        xhr.open("POST", "/tasks/" + todo.id + "/complete");

    xhr.send();
}

function search() {
    searchTodo((response, error) => {
        if (error) {
            console.log("Search failed:", error);
            alert("Search failed");
        } else if (response){
            //Success
            console.log("Search finished:", response);
            displayTodos(response); 
        }
    }); // Trigger the search function
}
// Search Functionality
function searchTodo(callback) {
    const query = document.getElementById('searchTodo').value.toLowerCase();
    
    xhr.onreadystatechange = function() { usingData(callback); };
    xhr.open("GET", "/tasks/search?query=" + query);
    xhr.send()
}

function displayAllTodos(){
    // Get all tasks
    xhr.onreadystatechange = function() { usingData((response, error) => {
        if (error) {
            console.log("Failed retrieving tasks:", error);
            alert("Failed retrieving tasks");
        } else if (response){
            //Success
            displayTodos(response); 
        }
    }); };
    xhr.open("GET", "/tasks");
    xhr.send();
    
}

function displayTodos(items) {
    const todos = items; 
    console.log(todos);
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    if ( !todos ){
        return 
    }
    todos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.classList.add('todo-item');

        if (todo.completed) {
            todoItem.style.opacity = '0.6';
        } else {
            todoItem.style.opacity = '1';
        }

        const todoText = document.createElement('span');
        todoText.classList.add('todo-text');

        if(todo.deadline){
            // If deadline is in the past, add the 'past-deadline' class
            if (todo.overdue){
                todoText.classList.add('past-deadline');
            }
            
            todoText.textContent = `(Due: ${todo.deadline}) ${todo.title}`;
            
        }
        else{
            todoText.textContent = todo.title;
        }


        if (todo.completed) {
            todoText.classList.remove('past-deadline');
            todoText.style.textDecoration = 'line-through';
            todoText.style.color = 'gray';
        } else {
            todoText.style.textDecoration = 'none';
            todoText.style.color = 'black';
        }

        // Open popup on click
        todoText.onclick = function () {
            openPopup(todo, todo.title, todo.deadline);
        };

        const doneButton = document.createElement('button');
        doneButton.classList.add('done');
        doneButton.textContent = todo.completed ? 'Undone' : 'Done';
        doneButton.onclick = () => toggleTodoStatus(todo);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete');
        deleteButton.textContent = 'Remove';
        deleteButton.onclick = () => deleteTodo(todo);

        todoItem.append(todoText, doneButton, deleteButton);
        todoList.appendChild(todoItem);
    });
}

let editingIndex = null;

/// Open Popup when a task is clicked
function openPopup(todo, text, deadline) {
    document.getElementById('searchTodo').value = "";

    editingIndex = todo;

    // Clone the popup template and append to the body
    const popupTemplate = document.getElementById('edit-popup-template');
    const popup = popupTemplate.content.cloneNode(true);

    // Get the textarea element and set its value
    const todoTextArea = popup.querySelector('#editTodoText');
    todoTextArea.value = text;
    
    // Set the deadline
    popup.querySelector('#editDeadline').value = deadline || "";

    // Append the popup to the body
    document.body.appendChild(popup);
}

// Close Popup
function closePopup() {
    const popup = document.getElementById('editPopup');
    if (popup) {
        popup.remove();  // Remove the popup from the DOM
    }
}

// Save Edited Task
function saveEdit() {
    const updatedText = document.getElementById('editTodoText').value;
    const updatedDeadline = document.getElementById('editDeadline').value;


    if (updatedText && updatedText.trim() !== "")  {
        editingIndex.title = updatedText.trim();
        editingIndex.deadline = updatedDeadline;
        xhr.onreadystatechange = function() { usingData((response, error) => {
            closePopup();
            if (error) {
                console.log("Action failed");
                alert("Action failed");
            } else {
                //Success
                displayAllTodos(); 
            }
        }); };

        xhr.open("PUT", "/tasks/" + editingIndex.id);
        console.log(editingIndex)
        xhr.send(editingIndex);
        
    }
    else{
        closePopup();
        alert("Invalid change.\n Text cannot be empty.");
    }

}


function clearDeadline() {
    document.getElementById('editDeadline').value = '';
}

function goToRegistration() {
    loadForm('registration');
}

function goToLogin() {
    loadForm('login');
}
