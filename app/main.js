const fs = require("fs");
const net = require("net");

console.log("Logs from your program will appear here!");

// Function to parse request
const parseRequest = (data) => {
    const [headerPart, bodyPart] = data.toString().split("\r\n\r\n");
    const lines = headerPart.split("\r\n");
    const [method, path, protocol] = lines[0].split(" ");

    const headers = {};
    for (let i = 1; i < lines.length; i++) {
        const [key, ...rest] = lines[i].split(": ");
        if (key && rest.length > 0) {
            headers[key] = rest.join(": ");
        }
    }

    return { method, path, protocol, headers, body: bodyPart || "" };
};

const server = net.createServer((socket) => {
    let buffer = "";

    socket.on("data", (chunk) => {
        buffer += chunk.toString();

        // Loop to handle multiple pipelined requests
        while (buffer.includes("\r\n\r\n")) {
            const [rawRequest, ...rest] = buffer.split("\r\n\r\n");
            const contentLengthMatch = rawRequest.match(/Content-Length: (\d+)/i);
            const expectedBodyLength = contentLengthMatch ? parseInt(contentLengthMatch[1]) : 0;

            const totalRequestLength = rawRequest.length + 4 + expectedBodyLength;
            if (buffer.length < totalRequestLength) break; // wait for full body

            const requestString = buffer.slice(0, totalRequestLength);
            buffer = buffer.slice(totalRequestLength); // remove processed request

            const { method, path, protocol, headers, body } = parseRequest(requestString);

            if (path === "/") {
                socket.write("HTTP/1.1 200 OK\r\n\r\n");
            } else if (path.includes("/echo/")) {
                const content = path.split("/echo/")[1];
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`);
            } else if (path === "/user-agent") {
                const userAgent = headers["User-Agent"] || "";
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
            } else if (path.startsWith("/files/") && method === "GET") {
                const directory = process.argv[3];
                const fileName = path.split("/files/")[1];
                const filePath = `${directory}/${fileName}`;
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath);
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`);
                } else {
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                }
            } else if (path.startsWith("/files/") && method === "POST") {
                const fileName = path.split("/files/")[1];
                const filePath = `${process.argv[3]}/${fileName}`;
                fs.writeFileSync(filePath, body);
                socket.write("HTTP/1.1 201 Created\r\n\r\n");
            } else {
                socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            }

            // Close only if client asks
            if (headers["Connection"] && headers["Connection"].toLowerCase() === "close") {
                socket.end();
            }
        }
    });

    socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.end();
        server.close();
    });
});

server.listen(4221, "localhost");
