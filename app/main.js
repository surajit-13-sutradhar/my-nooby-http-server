const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end()
        server.close()
    })

    socket.on("data", () => {
        // socket.write("HTTP/1.1 200 OK\r\n\r\n")
        console.log(data)
        const path = data.toString().split(" ")[1]
        const responseStatus = path === "/" ? "200 ok": "404 NOT found"
        socket.write(`HTTP/1.1 ${responseStatus} \r\n\r\n`)
    })

    

})


server.listen(4221, "localhost");
