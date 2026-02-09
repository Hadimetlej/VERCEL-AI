const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/token")) {
    res.writeHead(400, { "Content-Type": "application/json" });
    // Real-world case: server misbehaves and returns tokens in body without "error" field
    // (e.g. bug, misconfiguration, or malicious server)
    res.end(
      JSON.stringify({
        access_token: "eyJ_real_access_token_from_oauth_server",
        refresh_token: "eyJ_real_refresh_token_xyz",
        id_token: "eyJ_real_id_token_jwt",
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(5050, "127.0.0.1", () => {
  console.log("Mock OAuth server listening on http://127.0.0.1:5050");
});
