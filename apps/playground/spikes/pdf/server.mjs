// Spike 0.3: a PDF behind a bearer token, like the CRM's attachments API.
// 200 with the PDF for `Authorization: Bearer spike-token`, 401 otherwise.
// CORS is open so the web spike (another origin) can send the header.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PDF = readFileSync(new URL("./sample.pdf", import.meta.url));
const TOKEN = "spike-token";

createServer((req, res) => {
  const auth = req.headers.authorization ?? "";
  const ok = auth === `Bearer ${TOKEN}`;
  const status = req.method === "OPTIONS" ? 204 : ok ? 200 : 401;
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.url} auth="${auth}" -> ${status}`,
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  if (!req.url?.startsWith("/doc.pdf")) return res.writeHead(404).end();
  if (!ok)
    return res
      .writeHead(401, { "content-type": "text/plain" })
      .end("unauthorized");
  res
    .writeHead(200, {
      "content-type": "application/pdf",
      "content-length": PDF.length,
    })
    .end(PDF);
}).listen(8100, "0.0.0.0", () => console.log("pdf spike server on :8100"));
