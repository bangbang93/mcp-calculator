# mcp-calculator

An MCP server that wraps [MathJS](https://mathjs.org/) to give AI models a powerful `calculate` tool.  
Supports **stdio** (Claude Desktop) and **HTTP Streamable** transports.

---

## Installation

```bash
npm install
npm run build
```

---

## Usage

### Stdio mode (default)

```bash
node dist/index.js
```

### HTTP mode

```bash
# default port 3000
node dist/index.js --http

# custom port
PORT=8080 node dist/index.js --http

# via environment variable
TRANSPORT=http node dist/index.js
```

---

## Expression examples

| Category | Expression | Result |
|---|---|---|
| Arithmetic | `2 + 3 * 4` | `14` |
| Fractions | `1/3 + 1/6` | `0.5` |
| Powers | `2^10` | `1024` |
| Trigonometry | `sin(pi / 4)` | `0.70710678118655` |
| Inverse trig | `acos(0)` | `1.5707963267949` |
| Logarithm | `log(1000, 10)` | `3` |
| Complex numbers | `(2 + 3i) * (1 - 2i)` | `8 - i` |
| Statistics | `mean(1, 2, 3, 4, 5)` | `3` |
| Matrix determinant | `det([1, 2; 3, 4])` | `-2` |
| Matrix multiply | `[1,2;3,4] * [5;6]` | `[[17],[39]]` |
| Unit conversion | `2 km to mile` | `1.2427423844747 mile` |
| Constants | `e ^ (i * pi) + 1` | `2.8327021... × 10^-15 + 0i` ≈ `0` |

---

## Docker

Pull and run the pre-built image from Docker Hub:

```bash
# stdio mode (pipe JSON-RPC over stdin/stdout)
docker run --rm -i bangbang93/mcp-calculator node dist/index.js

# HTTP mode on port 3000
docker run --rm -p 3000:3000 bangbang93/mcp-calculator

# custom port
docker run --rm -p 8080:8080 -e PORT=8080 bangbang93/mcp-calculator
```

Build locally:

```bash
docker build -t mcp-calculator .
docker run --rm -p 3000:3000 mcp-calculator
```

---

## HTTP mode — usage examples

Once the server is running in HTTP mode (`node dist/index.js --http`), send JSON-RPC 2.0 requests with `curl`:

```bash
# Initialize a session
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'

# Call the calculate tool
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"calculate","arguments":{"expression":"sin(pi/4)"}}}'
```

---

## Claude Desktop configuration

Add the following to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-calculator/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/mcp-calculator` with the actual path where you cloned this repository.

Alternatively, use the Docker image so no local build is required:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "bangbang93/mcp-calculator", "node", "dist/index.js"]
    }
  }
}
```

---

## GitHub Copilot CLI

Add the server to your [GitHub Copilot CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line) MCP configuration (`~/.config/github-copilot/mcp.json` on Linux/macOS, `%APPDATA%\GitHub Copilot\mcp.json` on Windows):

```json
{
  "mcpServers": {
    "calculator": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-calculator/dist/index.js"]
    }
  }
}
```

Or with Docker:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "bangbang93/mcp-calculator", "node", "dist/index.js"]
    }
  }
}
```

After saving the config, the `calculate` tool is available to Copilot in any chat or inline suggestion session. You can also test it directly with `gh copilot suggest`:

```
$ gh copilot suggest "calculate sin(pi/4) using the calculator tool"
```

---

## opencode

Add the server to your [opencode](https://opencode.ai) configuration (`~/.config/opencode/config.json`):

```json
{
  "mcp": {
    "calculator": {
      "type": "local",
      "command": ["node", "/absolute/path/to/mcp-calculator/dist/index.js"]
    }
  }
}
```

Or HTTP mode (start the server first with `node dist/index.js --http`):

```json
{
  "mcp": {
    "calculator": {
      "type": "remote",
      "url": "http://localhost:3000"
    }
  }
}
```

---

## Development

```bash
# Run TypeScript directly (no build step)
npm run dev

# HTTP mode during development
npm run dev:http
```
