/**
 * Process-level crash and exception handlers for Court Clash server.
 * Catches unhandled promise rejections, uncaught exceptions, and termination signals.
 */
export function setupCrashHandlers(server) {
  process.on("uncaughtException", (error) => {
    console.error("[CRASH HANDLER] Uncaught Exception detected:");
    console.error(error.stack || error);
    // In production, give active sockets 2s to flush then exit
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRASH HANDLER] Unhandled Promise Rejection at:", promise);
    console.error("Reason:", reason);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n[CRASH HANDLER] Received ${signal}. Initiating graceful shutdown...`);
    if (server) {
      server.close(() => {
        console.log("[CRASH HANDLER] HTTP & Socket.IO server closed successfully.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}
