const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end()
        server.close()
    })

    socket.on("data", (data) => {
        // socket.write("HTTP/1.1 200 OK\r\n\r\n")
        console.log(data)
        const path = data.toString().split(" ")[1]
        if(path === "/") {socket.write("HTTP/1.1 200 OK\r\n\r\n")}
        else if(path.includes("/echo/")) {
            const content = path.split("/echo/")[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`)
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
