
/**
 * Network - Simulates a communication network between the client and the server.
 */
class Network {
    // Network configurations.
    static dropPercentage = 0.1; // The percentage of requests that will be dropped (between 0.1 and 0.5).
    static requestCounter = 1; // Request counter up to 10.
    static responseCounter = 1; // Response counter up to 10.
    static droppedRequestIndices = []; // Indexes of requests to be dropped.
    static droppedResponseIndices = []; // Indexes of responses to be dropped.
    
    /**
     * Generates indexes of messages to be dropped from the next 10 messages.
     * @param {Array} array - The array of indexes to be populated.
     */
    static generateDroppedIndices(array) {
        // Clearing the existing array.
        array.length = 0;
        
        // The number of messages to be dropped in each round of 10.
        const numToDrop = Math.round(this.dropPercentage * 10);
        
        // Creating an array of indexes for messages to be dropped.
        while (array.length < numToDrop) {
            // Generate a random number between 1 and 10.
            const randomIndex = Math.floor(Math.random() * 10) + 1;
            
            // Checking that the index does not already exist in the array.
            if (!array.includes(randomIndex)) {
                array.push(randomIndex);
            }
        }
        
        return array;
    }

    /**
     * Sending a request through the network.
     * @param {FXMLHttpRequest} request 
     */
    static sendRequest(request) {
        console.log(`Network: Processing request #${this.requestCounter} to ${request.url}`);
        
        // Checking if a new set of indexes for dropping needs to be generated.
        if (this.requestCounter === 1 || this.droppedRequestIndices.length === 0) {
            this.generateDroppedIndices(this.droppedRequestIndices);
            console.log(`Network: Generated dropped request indices: ${this.droppedRequestIndices.join(', ')}`);
        }
        
        // Checking if a new set of indexes for dropping responses needs to be generated.
        if (this.responseCounter === 1 || this.droppedResponseIndices.length === 0) {
            this.generateDroppedIndices(this.droppedResponseIndices);
            console.log(`Network: Generated dropped response indices: ${this.droppedResponseIndices.join(', ')}`);
        }
        
        // Checking if the current request is supposed to be dropped.
        if (this.droppedRequestIndices.includes(this.requestCounter)) {
            console.log(`Network: Request #${this.requestCounter} dropped! (Drop rate: ${this.dropPercentage * 100}%)`);
            
            // Incrementing the counter.
            this.requestCounter = (this.requestCounter % 10) + 1;
            
            // Returning a network error.
            setTimeout(() => {
                request._receiveResponse(5, JSON.stringify({ 
                    error: "Network error: Request failed to reach its destination" 
                }));
            }, 500);
            
            return;
        }

        const requestDelay = Math.random() * 1000;
        console.log(`Network: Request will be processed in ${Math.round(requestDelay)}ms`);

        setTimeout(() => {
            // Incrementing the request counter.
            this.requestCounter = (this.requestCounter % 10) + 1;
            
            let response;

            // Routing the request to the appropriate server.
            if (request.url.startsWith("/tasks")) {
                response = TasksServer.handleRequest(request.method, request.url, request.body);
            } else if (request.url.startsWith("/users")) {
                response = UsersServer.handleRequest(request.method, request.url, request.body);
            } else {
                response = { status: 404, message: "Not Found", data: null };
            }
            
            // Checking if the response is supposed to be dropped.
            if (this.droppedResponseIndices.includes(this.responseCounter)) {
                console.log(`Network: Response #${this.responseCounter} dropped! (Drop rate: ${this.dropPercentage * 100}%)`);
                
                // Incrementing the response counter.
                this.responseCounter = (this.responseCounter % 10) + 1;
                
                 // Returning a network error.
                setTimeout(() => {
                    request._receiveResponse(5, JSON.stringify({ 
                        error: "Network error: Response failed to reach its destination" 
                    }));
                }, 500);
                return;
            }
            
            const responseDelay = Math.random() * 1000;
            console.log(`Network: Response will be sent in ${Math.round(responseDelay)}ms`);

            setTimeout(() => {
                // Incrementing the response counter.
                this.responseCounter = (this.responseCounter % 10) + 1;
                
                // Sending the response back to the client.
                console.log(`Network: Response ready for ${request.url}, status: ${response.status}`);
                request._receiveResponse(response.status, JSON.stringify(response));
            }, responseDelay);
        }, requestDelay);
    }
    
    /**
     * Setting the percentage of requests to be dropped.
     * @param {number} percentage
     */
    static setDropPercentage(percentage) {
        if (percentage >= 0.1 && percentage <= 0.5) {
            this.dropPercentage = percentage;
            console.log(`Network: Drop percentage set to ${percentage * 100}%`);
            // Creating a new set of indexes to be dropped.
            this.generateDroppedIndices(this.droppedRequestIndices);
            this.generateDroppedIndices(this.droppedResponseIndices);
        } else {
            console.error("Network: Drop percentage must be between 0.1 and 0.5");
        }
    }
}