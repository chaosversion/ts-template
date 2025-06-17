import { app } from "./app";
import { env } from "./env";

async function startServer() {
  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });
    console.log(`🚀 Server running on port ${env.PORT}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
