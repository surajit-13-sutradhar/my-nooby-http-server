# HTTP Server Implementation

A robust HTTP/1.1 server implementation in JavaScript, built from scratch using Node.js's native `net` module. This server demonstrates core web server concepts including TCP communication, HTTP protocol implementation, and concurrent client handling.

## Features

- **HTTP/1.1 Compliant**: Implements core HTTP/1.1 protocol features
- **Multi-Client Support**: Handles multiple concurrent connections
- **TCP-Based Communication**: Built on Node.js's native `net` module
- **Request Parsing**: Properly parses HTTP requests including headers and body
- **Response Handling**: Supports various HTTP response codes and headers
- **Content Compression**: Supports gzip compression for responses
- **File Operations**: Supports file uploads and downloads
- **Connection Management**: Handles persistent and non-persistent connections

## Technical Details

### Supported Endpoints

- `GET /` - Returns a simple 200 OK response
- `GET /echo/<text>` - Echoes back the provided text
- `GET /user-agent` - Returns the client's User-Agent header
- `GET /files/<filename>` - Downloads the specified file
- `POST /files/<filename>` - Uploads content to the specified file

### HTTP Features

- Content-Length header support
- Connection header handling (keep-alive/close)
- Accept-Encoding header support (gzip compression)
- Proper HTTP response codes (200, 201, 404)
- Content-Type header support
- Chunked transfer encoding support

## Prerequisites

- Node.js (v21 or higher)
- npm (comes with Node.js)

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Server

To start the server in development mode:

```bash
npm run dev
```

The server will start on `localhost:4221`.

### Running with File Directory

To start the server with a specific directory for file operations:

```bash
./your_program.sh <directory-path>
```

## Project Structure

```
.
├── app/
│   └── main.js          # Main server implementation
├── package.json         # Project configuration
├── package-lock.json    # Dependency lock file
└── your_program.sh      # Server startup script
```

## Development

### Core Components

The server implementation (`app/main.js`) includes:

- **TCP Server Setup**: Creates a TCP server using Node.js's `net` module
- **Request Parser**: Parses HTTP requests including headers and body
- **Response Builder**: Constructs proper HTTP responses
- **Connection Handler**: Manages client connections and concurrency
- **File Handler**: Handles file uploads and downloads
- **Compression Handler**: Manages gzip compression of responses

### Key Features

1. **Concurrent Connections**: Uses Node.js's event-driven architecture to handle multiple clients
2. **Buffer Management**: Properly handles request buffering and parsing
3. **Error Handling**: Graceful error handling for various scenarios
4. **Resource Management**: Proper cleanup of resources and connections

## Testing

The server can be tested using standard HTTP clients or tools like `curl`:

```bash
# Test basic endpoint
curl http://localhost:4221/

# Test echo endpoint
curl http://localhost:4221/echo/hello

# Test file download
curl http://localhost:4221/files/test.txt

# Test file upload
curl -X POST -d "file content" http://localhost:4221/files/test.txt
```

## Performance Considerations

- Uses Node.js's native modules for optimal performance
- Implements proper buffer management to handle large requests
- Supports connection pooling for better resource utilization
- Implements gzip compression for reduced bandwidth usage

## License

MIT License - See LICENSE file for details
