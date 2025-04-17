const fs = require("fs")
const net = require("net")

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end()
    })

    socket.on("data", (data) => {
        // socket.write("HTTP/1.1 200 OK\r\n\r\n")
        console.log(data)
        const path = data.toString().split(" ")[1]
        const headers = data.toString().split("\r\n")
        
        if(path === "/") {socket.write("HTTP/1.1 200 OK\r\n\r\n")}
        // If path includes "echo"
        else if(path.includes("/echo/")) {
            const content = path.split("/echo/")[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`)
        }
        // If path starts with "/files/"
        else if(path.startsWith("/files/")) {
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
        // If path is user-agent
        else if(path === "/user-agent") {
            const userAgent = headers[2].split('User-Agent: ')[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);

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
