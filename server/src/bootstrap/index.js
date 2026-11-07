import { setupCrashHandlers } from "./crashHandlers.js";
import { setupDatabase } from "./database.js";
import { setupSwagger } from "./swagger.js";

/**
 * Master server bootstrap:
 * 1. Attaches process crash handlers
 * 2. Connects to database (with fallback)
 * 3. Mounts Swagger API documentation
 */
export async function bootstrap(app, server) {
  console.log("=".repeat(50));
  console.log("🚀 BOOTSTRAPPING COURT CLASH SERVER");
  console.log("=".repeat(50));

  // 1. Crash Handlers
  setupCrashHandlers(server);

  // 2. Database
  const dbStatus = await setupDatabase();

  // 3. Swagger OpenAPI Documentation
  setupSwagger(app);

  console.log("=".repeat(50));
  return { dbStatus };
}
