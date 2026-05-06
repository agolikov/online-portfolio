import "dotenv/config";
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
}

app.listen(PORT, () => {
  console.log(`App server listening on http://localhost:${PORT}`);
});
