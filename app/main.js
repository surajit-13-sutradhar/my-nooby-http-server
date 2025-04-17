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
        let responseStatus 
        if(path = "/") responseStatus = "200 OK"
        else if(path.includes("/echo/")) {
            const content = path.split("/echo/")[1]
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`)
        }
        else responseStatus = "404 Not Found"
        socket.write(`HTTP/1.1 ${responseStatus}\r\n\r\n`)
    })

    socket.on("error", (err) => {
        console.error("Socket error:", err)
        socket.end()
        server.close()
    })
})

server.listen(4221, "localhost");
