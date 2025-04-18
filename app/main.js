const fs = require("fs");
const net = require("net");

console.log("Logs from your program will appear here!");

const OK_RESPONSE = "HTTP/1.1 200 OK";
const NOT_FOUND_RESPONSE = "HTTP/1.1 404 Not Found";

// Helper to format a proper HTTP response
function createResponse(statusLine, headers = {}, body = "") {
    let response = `${statusLine}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
        response += `${key}: ${value}\r\n`;
    }
    response += `\r\n${body}`;
    return response;
}

// Parses the incoming raw request
function parseRequest(requestData) {
    const [headerPart, body] = requestData.toString().split("\r\n\r\n");
    const lines = headerPart.split("\r\n");
    const [method, path, protocol] = lines[0].split(" ");
    const headers = {};

    for (let i = 1; i < lines.length; i++) {
        const [key, value] = lines[i].split(": ");
        if (key && value) headers[key] = value;
    }

    return { method, path, protocol, headers, body };
}

// TCP Server
const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);

    socket.on("data", (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (true) {
            const headersEnd = buffer.indexOf("\r\n\r\n");
            if (headersEnd === -1) break;

            const rawHeader = buffer.toString("utf-8", 0, headersEnd);
            const contentLengthMatch = rawHeader.match(/Content-Length: (\d+)/i);
            const contentLength = contentLengthMatch ? parseInt(contentLengthMatch[1]) : 0;
            const totalLength = headersEnd + 4 + contentLength;

            if (buffer.length < totalLength) break;

            const fullRequest = buffer.slice(0, totalLength).toString();
            buffer = buffer.slice(totalLength);

            const { method, path, headers, body } = parseRequest(fullRequest);

            let shouldClose = headers["Connection"]?.toLowerCase() === "close";
            let response = "";

            if (path === "/") {
                response = createResponse(OK_RESPONSE, { "Content-Length": 0 });
            }

            else if (path.startsWith("/echo")) {
                const message = path.slice(6);
                response = createResponse(OK_RESPONSE, {
                    "Content-Type": "text/plain",
                    "Content-Length": message.length
                }, message);
            }

            else if (path === "/user-agent") {
                const agent = headers["User-Agent"] || "";
                response = createResponse(OK_RESPONSE, {
                    "Content-Type": "text/plain",
                    "Content-Length": agent.length
                }, agent);
            }

            else if (path.startsWith("/files/") && method === "GET") {
                const fileName = path.slice("/files/".length);
                const filePath = `${process.argv[3]}${fileName}`;
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath);
                    response = createResponse(OK_RESPONSE, {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": content.length
                    }, content);
                } else {
                    response = createResponse(NOT_FOUND_RESPONSE, {
                        "Content-Length": 0
                    });
                }
            }

            else if (path.startsWith("/files/") && method === "POST") {
                const fileName = path.slice("/files/".length);
                const filePath = `${process.argv[3]}${fileName}`;
                fs.writeFileSync(filePath, body);
                response = createResponse("HTTP/1.1 201 Created", {
                    "Content-Length": 0
                });
            }

            else {
                response = createResponse(NOT_FOUND_RESPONSE, {
                    "Content-Length": 0
                });
            }

            if (shouldClose) {
                response = response.replace("\r\n\r\n", "\r\nConnection: close\r\n\r\n");
            }

            socket.write(response, () => {
                if (shouldClose) socket.end();
            });
        }
    });

    socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.end();
    });
});

server.listen(4221, "localhost");
