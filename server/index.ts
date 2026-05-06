import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";

const PORT = Number(process.env.PORT ?? 3004);

if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    appType: "spa",
    server: {
      middlewareMode: true,
      hmr: true,
    },
  });
  app.use(vite.middlewares);
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`App server listening on http://localhost:${PORT}`);
});
