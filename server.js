const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const next = require("next");
const path = require("path"); // 添加这行来导入 path 模块

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  // console.log("Starting integrated server...");

  // Middleware to log incoming requests
  app.use((req, res, nextMiddleware) => {
    // console.log(`[Express] Received request for ${req.url}`);
    nextMiddleware();
  });

  // Serve Next.js static files
  app.use("/_next", express.static(path.join(__dirname, ".next")));

  // Add this condition to exclude /dev path from proxy
  app.use((req, res, next) => {
    if (req.url.startsWith("/dreampal")) {
      return handle(req, res);
    }
    next();
  });

  // Proxy setup for '/' path (excluding /dev)
  app.use(
    "/",
    createProxyMiddleware({
      target: "https://app.dreampal.ai/",
      changeOrigin: true,
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        const { method, url, headers } = req;

        if (method === "POST") {
          let bodyData = "";
          req.on("data", (chunk) => {
            bodyData += chunk.toString();
          });
          req.on("end", () => {
            // console.log("Request body:", bodyData);
          });
        }
      },
      onProxyRes: (proxyRes, req, res) => {

        // Modify response headers to allow cross-origin access
        proxyRes.headers["Access-Control-Allow-Origin"] =
          "http://localhost:30000";
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET, POST, PUT, DELETE, OPTIONS";
        proxyRes.headers["Access-Control-Allow-Headers"] =
          "Content-Type, Authorization";

        // Log additional info for API requests
        if (req.url.includes("/api/")) {
          console.log(`Request URL: ${req.url}`);
          console.log(`Request Method: ${req.method}`);
          console.log(`Status Code: ${proxyRes.statusCode}`);
          console.log(`Remote Address: ${req.connection.remoteAddress}`);
        }

        // Remove Content-Security-Policy header
        delete proxyRes.headers["content-security-policy"];
      },
      pathRewrite: {
        "^/": "/",
      },
    })
  );

  // Handle all other routes with Next.js
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start the server
  const port = 3002;
  app.listen(port, (err) => {
    if (err) throw err;
    // console.log(`Server running at http://localhost:${port}`);
  });

  // Error handling
  app.on("error", (error) => {
    // console.error("An error occurred:", error);
  });

  process.on("uncaughtException", (error) => {
    // console.error("Uncaught exception:", error);
  });
});
