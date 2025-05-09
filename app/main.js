const fs = require("fs");
const net = require("net");
const zlib = require("zlib");

console.log("Logs from your program will appear here!");

// Function to parse the request
const parseRequest = (requestData) => {
    const request = requestData.toString().split("\r\n");
    const [method, path, protocol] = request[0].split(" ");
    const headers = {};
    request.slice(1).forEach((header) => {
        const [key, value] = header.split(": ");
        if (key && value) {
            headers[key] = value;
        }
    });
    return { method, path, protocol, headers };
};

// Function to check if gzip is supported in Accept-Encoding header
const supportsGzip = (acceptEncoding) => {
    if (!acceptEncoding) return false;
    
    // Split by comma and trim each value
    const encodings = acceptEncoding.split(',').map(encoding => encoding.trim().toLowerCase());
    
    // Check if gzip is in the list of supported encodings
    return encodings.includes('gzip');
};

// Function to compress data with gzip
const compressWithGzip = (data) => {
    return zlib.gzipSync(data);
};

const OK_RESPONSE = "HTTP/1.1 200 OK\r\n";
const ERROR_RESPONSE = "HTTP/1.1 404 Not Found\r\n";

// Create server to handle multiple concurrent requests
const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0); // For the current connection

    socket.on("data", (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (true) {
            // Try to parse one full request
            const rawRequest = buffer.toString().split("\r\n\r\n")[0];
            const headersEndIndex = buffer.indexOf("\r\n\r\n");

            if (headersEndIndex === -1) break; // Header incomplete

            const contentLengthMatch = rawRequest.match(/Content-Length: (\d+)/i);
            const expectedBodyLength = contentLengthMatch ? parseInt(contentLengthMatch[1]) : 0;

            const totalRequestLength = headersEndIndex + 4 + expectedBodyLength;
            if (buffer.length < totalRequestLength) break;

            // Extract and remove the full request from the buffer
            const fullRequest = buffer.slice(0, totalRequestLength);
            buffer = buffer.slice(totalRequestLength);

            const request = parseRequest(fullRequest);
            const { method, path, headers } = request;

            let responseHeader = OK_RESPONSE;
            let closeConnection = false;

            // Check if the connection should be closed after response
            if (headers["Connection"] && headers["Connection"].toLowerCase() === "close") {
                closeConnection = true;
                responseHeader += "Connection: close\r\n";
            }

            // Handle Accept-Encoding with multiple compression schemes
            const acceptEncoding = headers["Accept-Encoding"] || "";
            const useGzip = supportsGzip(acceptEncoding);

            // Handle the various paths as per the request
            if (path === "/") {
                socket.write(`${responseHeader}\r\n`);
            } else if (path.startsWith("/echo")) {
                const content = path.substring(6);
                let responseBody = Buffer.from(content);
                
                if (useGzip) {
                    // Compress the response body
                    responseBody = compressWithGzip(responseBody);
                    
                    // Write response with gzip header
                    socket.write(
                        `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${responseBody.length}\r\nContent-Encoding: gzip\r\n\r\n`
                    );
                } else {
                    // Write response without gzip header
                    socket.write(
                        `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${responseBody.length}\r\n\r\n`
                    );
                }
                
                socket.write(responseBody);
            } else if (path.startsWith("/user-agent")) {
                const agent = headers["User-Agent"];
                let responseBody = Buffer.from(agent);
                
                if (useGzip) {
                    // Compress the response body
                    responseBody = compressWithGzip(responseBody);
                    
                    // Write response with gzip header
                    socket.write(
                        `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${responseBody.length}\r\nContent-Encoding: gzip\r\n\r\n`
                    );
                } else {
                    // Write response without gzip header
                    socket.write(
                        `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${responseBody.length}\r\n\r\n`
                    );
                }
                
                socket.write(responseBody);
            } else if (path.startsWith("/files/") && method === "GET") {
                const fileName = path.replace("/files/", "").trim();
                const filePath = process.argv[3] + "/" + fileName;
                
                try {
                    if (fs.existsSync(filePath)) {
                        let responseBody = fs.readFileSync(filePath);
                        
                        if (useGzip) {
                            // Compress the response body
                            responseBody = compressWithGzip(responseBody);
                            
                            // Write response with gzip header
                            socket.write(
                                `${responseHeader}Content-Type: application/octet-stream\r\nContent-Length: ${responseBody.length}\r\nContent-Encoding: gzip\r\n\r\n`
                            );
                        } else {
                            // Write response without gzip header
                            socket.write(
                                `${responseHeader}Content-Type: application/octet-stream\r\nContent-Length: ${responseBody.length}\r\n\r\n`
                            );
                        }
                        
                        socket.write(responseBody);
                    } else {
                        socket.write(ERROR_RESPONSE + "\r\n\r\n");
                    }
                } catch (err) {
                    socket.write(ERROR_RESPONSE + "\r\n\r\n");
                }
            } else if (path.startsWith("/files/") && method === "POST") {
                const filename = path.substring(7);
                const filePath = process.argv[3] + "/" + filename;
                
                // Extract body content
                const bodyStart = headersEndIndex + 4;
                const bodyContent = fullRequest.slice(bodyStart, bodyStart + expectedBodyLength);
                
                fs.writeFileSync(filePath, bodyContent);
                socket.write(`HTTP/1.1 201 Created\r\nContent-Type: text/plain\r\nContent-Length: 0\r\n\r\n`);
            } else {
                socket.write(ERROR_RESPONSE + "\r\n\r\n");
            }

            // If Connection: close was requested, close the socket after sending the response
            if (closeConnection) {
                socket.end(); // Close the connection
            }
        }
    });

    socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.end();
    });
});

server.listen(4221, "localhost", () => {
    console.log("Server listening on port 4221");
});