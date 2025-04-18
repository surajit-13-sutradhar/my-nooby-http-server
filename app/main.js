const fs = require("fs")
const net = require("net")

console.log("Logs from your program will appear here!");

// Function to parse request
const parseRequest = (data) => {
    const request = data.toString().split("\r\n");
    const [method, path, protocol] = request[0].split(" ");

    const headers = {};
    for (let i = 1; i < request.length; i++) {
        const [key, ...rest] = request[i].split(": ");
        if (key && rest.length > 0) {
            headers[key] = rest.join(": ");
        }
    }

    return { method, path, protocol, headers };
};

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });

    socket.on("data", (data) => {
        const request = parseRequest(data);
        const { method, path, protocol, headers } = request;

        if (path === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        }
        // If path includes "echo"
        else if (path.includes("/echo/")) {
            const content = path.split("/echo/")[1];
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`);
        }
        // If path is user-agent
        else if (path === "/user-agent") {
            const userAgent = headers["User-Agent"];
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
        }
        // If path starts with "/files/" and method is GET
        else if (path.startsWith("/files/") && method === "GET") {
            const directory = process.argv[3];
            const fileName = path.split("/files/")[1];
            const filePath = `${directory}/${fileName}`;
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
                socket.write(res);
            } else {
                socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            }
        }
        // If path starts with "/files/" and method is POST
        else if (path.startsWith("/files/") && method === "POST") {
            const fileName = path.split("/files/")[1];
            const filePath = `${process.argv[3]}/${fileName}`;
            const req = data.toString().split("\r\n");
            const body = req[req.length - 1];
            fs.writeFileSync(filePath, body);
            socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
        } else {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }

        socket.end(); // ensure the socket closes after response
    });

    socket.on("error", (err) => {
        console.error("Socket error:", err);
        socket.end();
        server.close();
    });
});

server.listen(4221, "localhost");
