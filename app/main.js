const fs = require("fs");
const net = require("net");

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

            if (headers["Connection"] && headers["Connection"].toLowerCase() === "close") {
                closeConnection = true;
                responseHeader = responseHeader.replace("OK", "OK\r\nConnection: close");
            }

            // Handle the various paths as per the request
            if (path === "/") {
                socket.write(`${responseHeader}\r\n`);
            } else if (path.startsWith("/echo")) {
                const content = path.substring(6);
                socket.write(
                    `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
                );
            } else if (path.startsWith("/user-agent")) {
                const agent = headers["User-Agent"];
                socket.write(
                    `${responseHeader}Content-Type: text/plain\r\nContent-Length: ${agent.length}\r\n\r\n${agent}`
                );
            } else if (path.startsWith("/files/") && method === "GET") {
                const fileName = path.replace("/files/", "").trim();
                const filePath = process.argv[3] + fileName;
                const isExist = fs.readdirSync(process.argv[3]).some((file) => {
                    return file === fileName;
                });
                if (isExist) {
                    const content = fs.readFileSync(filePath, "utf-8");
                    socket.write(
                        `${responseHeader}Content-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
                    );
                } else {
                    socket.write(ERROR_RESPONSE + "\r\n\r\n");
                }
            } else if (path.startsWith("/files/") && method === "POST") {
                const filename = process.argv[3] + "/" + path.substring(7);
                const req = data.toString().split("\r\n");
                const body = req[req.length - 1];
                fs.writeFileSync(filename, body);
                socket.write(`${responseHeader}Created\r\n\r\n`);
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

server.listen(4221, "localhost");
