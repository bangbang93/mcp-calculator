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

---

## Development

```bash
# Run TypeScript directly (no build step)
npm run dev

# HTTP mode during development
npm run dev:http
```
