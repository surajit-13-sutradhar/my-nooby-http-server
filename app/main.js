const fs = require("fs")
const net = require("net")

console.log("Logs from your program will appear here!");

// Function to parse request
const parseRequest = (requestData) => {
    const request = data.toString().split("\r\n\r\n")
    const [method, path, protocol] = request[0].split(" ")

    const headers = {}
    request.slice(1).forEach((header) => {
        const [key, value] = header.split(": ")
        if (key && value) {
            headers[key] = value
        }
    })

    return {method, path, protocol, headers}
}

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end()
    })

    socket.on("data", (data) => {
        // socket.write("HTTP/1.1 200 OK\r\n\r\n")
        console.log(data)
        const request = parseRequest(data)
        const { method, path, protocol, headers } = request
        
        if(path === "/") {socket.write("HTTP/1.1 200 OK\r\n\r\n")}
        // If path includes "echo"
        else if(path.includes("/echo/")) {
            const content = path.split("/echo/")[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`)
        }
        // If path is user-agent
        else if(path === "/user-agent") {
            const userAgent = headers[2].split('User-Agent: ')[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
        }
        // If path starts with "/files/"
        else if(path.startsWith("/files/") && method === "GET") {
            // Check if the path is a file
            const directory = process.argv[3]
            const fileName = path.split("/files/")[1]
            if(fs.existsSync(`${directory}/${fileName}`)) {
                const content = fs.readFileSync(`${directory}/${fileName}`).toString();
                    const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
                    socket.write(res);
            } 
            else {
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            }
        }
        // If path starts with "/files/" and method is POST
        else if(path.startsWith("/files/") && method === "POST"){
            const filename = process.argv[3] 
            const req = data.toString().split("\r\n");
            const body = req[req.length - 1];
            fs.writeFileSync(filename, body);
            socket.write(`HTTP/1.1 201 CREATED\r\n\r\n`)
        }
        
        else {socket.write("HTTP/1.1 404 Not Found\r\n\r\n")}
        
    })

    socket.on("error", (err) => {
        console.error("Socket error:", err)
        socket.end()
        server.close()
    })
})

server.listen(4221, "localhost");
