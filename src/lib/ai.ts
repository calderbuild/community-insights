import https from "https";
import http from "http";
import tls from "tls";

const API_KEY = (process.env.AI_API_KEY || "").trim();
const BASE_URL = (process.env.AI_BASE_URL || "https://newapi.deepwisdom.ai/v1").trim();
const MODEL = process.env.AI_MODEL || "claude-sonnet-4-20250514";

export type AIMessage = { role: "system" | "user"; content: string };

export async function callAI(
  promptOrMessages: string | AIMessage[]
): Promise<string> {
  const url = new URL(`${BASE_URL}/chat/completions`);
  const messages = typeof promptOrMessages === "string"
    ? [{ role: "user" as const, content: promptOrMessages }]
    : promptOrMessages;
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: 8192,
    messages,
  });

  // Try direct HTTPS first (works on Vercel and environments without proxy)
  try {
    const content = await directCall(url, body);
    return content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // If response is HTML (proxy interception), try CONNECT tunnel
    if (msg.includes("HTML") || msg.includes("html") || msg.includes("<!doctype")) {
      return connectTunnel(url, body);
    }
    throw err;
  }
}

function directCall(url: URL, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.headers["content-type"]?.includes("text/html")) {
            reject(new Error("Got HTML response - proxy interception"));
            return;
          }
          if (res.statusCode !== 200) {
            if (res.statusCode === 401) reject(new Error("AI service authentication failed"));
            else if (res.statusCode === 429) reject(new Error("AI service rate limited, please try again later"));
            else reject(new Error(`AI service error (${res.statusCode})`));
            return;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.message?.content || "";
            if (!content) {
              reject(new Error("Empty AI response"));
              return;
            }
            resolve(content);
          } catch {
            reject(new Error("Failed to parse AI response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function connectTunnel(url: URL, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proxyReq = http.request({
      hostname: "127.0.0.1",
      port: 7897,
      method: "CONNECT",
      path: `${url.hostname}:443`,
    });

    proxyReq.on("connect", (res, socket) => {
      if (res.statusCode !== 200) {
        reject(new Error(`CONNECT failed: ${res.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect(
        { host: url.hostname, socket, servername: url.hostname },
        () => {
          const reqStr =
            `POST ${url.pathname} HTTP/1.1\r\n` +
            `Host: ${url.hostname}\r\n` +
            `Content-Type: application/json\r\n` +
            `Authorization: Bearer ${API_KEY}\r\n` +
            `Content-Length: ${Buffer.byteLength(body)}\r\n` +
            `Connection: close\r\n` +
            `\r\n` +
            body;
          tlsSocket.write(reqStr);

          let data = "";
          tlsSocket.on("data", (c: Buffer) => (data += c.toString()));
          tlsSocket.on("end", () => {
            try {
              const idx = data.indexOf("\r\n\r\n");
              if (idx === -1) {
                reject(new Error("Invalid HTTP response from tunnel"));
                return;
              }
              const headers = data.slice(0, idx);
              let respBody = data.slice(idx + 4);

              if (headers.includes("Transfer-Encoding: chunked")) {
                respBody = parseChunked(respBody);
              }

              const json = JSON.parse(respBody);
              const content = json.choices?.[0]?.message?.content || "";
              if (!content) {
                reject(new Error("Empty AI response via tunnel"));
                return;
              }
              resolve(content);
            } catch (e) {
              reject(new Error(`Tunnel parse error: ${data.slice(0, 200)}`));
            }
          });
        }
      );
      tlsSocket.on("error", reject);
    });

    proxyReq.on("error", (err) => {
      reject(new Error(`Proxy unavailable: ${err.message}`));
    });

    proxyReq.end();
  });
}

function parseChunked(data: string): string {
  let result = "";
  let remaining = data;
  while (remaining.length > 0) {
    const lineEnd = remaining.indexOf("\r\n");
    if (lineEnd === -1) break;
    const size = parseInt(remaining.slice(0, lineEnd).trim(), 16);
    if (isNaN(size) || size === 0) break;
    remaining = remaining.slice(lineEnd + 2);
    result += remaining.slice(0, size);
    remaining = remaining.slice(size + 2);
  }
  return result || data;
}
