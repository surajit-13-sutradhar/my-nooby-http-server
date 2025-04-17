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
        const responseStatus = path === "/" ? "200 ok": "404 NOT found"
        socket.write(`HTTP/1.1 ${responseStatus} \r\n\r\n`)
    })
})


server.listen(4221, "localhost");
