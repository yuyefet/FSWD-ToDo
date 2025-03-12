/**
 * FXMLHttpRequest - A simulation of XMLHttpRequest for mock communication between client and server
 */
class FXMLHttpRequest {
    constructor() {
        this.readyState = 0;
        this.status = 0;
        this.responseText = "";
        this.onreadystatechange = null;
    }

    /**
     * Opens a new request to the server
     * @param {string} method - Request method (GET, POST, PUT, DELETE)
     * @param {string} url - Target URL of the request
     */
    open(method, url) {
        console.log(`FAJAX: Opening ${method} request to ${url}`);
        this.method = method;
        this.url = url;
        this.readyState = 1;
        
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }


    /**
     * Sends the request to the server
     * @param {string|null} body - Request body (optional)
     */
    send(body) {
        this.body = body;
        this.readyState = 2;
        
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
        
        console.log(`FAJAX: Sending ${this.method} request to ${this.url}`);
        
        // Transmitting the request over the communication network
        Network.sendRequest(this);
    }

    /**
     * Internal method called by Network when a response is received
     * @param {number} status - Response status code
     * @param {string} responseText - Response body as text
     */
    _receiveResponse(status, responseText) {
        console.log(`FAJAX: Received response with status ${status}`);
        
        this.readyState = 4;
        this.status = status;
        this.responseText = responseText;
        
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }
}
