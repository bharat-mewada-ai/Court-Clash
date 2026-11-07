import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Court Clash Backend API",
    version: "1.0.0",
    description: "Authoritative Game Engine & Multi-Party Courtroom Server for Court Clash simulation.",
    contact: {
      name: "Court Clash Engineering Team"
    }
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local Development Server"
    }
  ],
  tags: [
    { name: "Health", description: "Service health and diagnostics" },
    { name: "Rooms", description: "Courtroom chamber lifecycle & state endpoints" },
    { name: "Constitutions", description: "Rulebook namespaces and retrieval catalogs" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check server status and active rooms",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    service: { type: "string", example: "Court Clash Game Server" },
                    activeRooms: { type: "integer", example: 3 }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rooms": {
      post: {
        tags: ["Rooms"],
        summary: "Create a new courtroom session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  constitutionId: { type: "string", example: "indian_constitution" },
                  judgePersona: { type: "string", enum: ["Strict", "Chill", "Textualist"], example: "Strict" },
                  creatorName: { type: "string", example: "Petitioner Advocate" },
                  turnDuration: { type: "integer", example: 60 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Room created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    roomId: { type: "string", example: "court-42" },
                    room: { $ref: "#/components/schemas/RoomState" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rooms/{roomId}": {
      get: {
        tags: ["Rooms"],
        summary: "Fetch active room state by Room ID",
        parameters: [
          {
            name: "roomId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "court-42"
          }
        ],
        responses: {
          200: {
            description: "Current synchronized room state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoomState" }
              }
            }
          },
          404: {
            description: "Room not found"
          }
        }
      }
    },
    "/api/constitutions": {
      get: {
        tags: ["Constitutions"],
        summary: "List all available constitutions and rulebooks",
        responses: {
          200: {
            description: "List of public and user-created rulebooks",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      isBuiltIn: { type: "boolean" },
                      articlesCount: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Constitutions"],
        summary: "Create and ingest a custom constitution into a private vector namespace",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "articles"],
                properties: {
                  name: { type: "string", example: "Gaming Guild Charter" },
                  description: { type: "string", example: "Rules for competitive guild disputes" },
                  articles: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["number", "title", "text"],
                      properties: {
                        number: { type: "string", example: "Article 1" },
                        title: { type: "string", example: "Anti-Cheating Policy" },
                        part: { type: "string", example: "Section A" },
                        text: { type: "string", example: "No third-party modification scripts permitted." }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Custom constitution created and ingested into RAG namespace"
          }
        }
      }
    },
    "/api/constitutions/{id}": {
      get: {
        tags: ["Constitutions"],
        summary: "Get constitution details and all article clauses",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Full constitution details with articles" },
          404: { description: "Constitution not found" }
        }
      },
      delete: {
        tags: ["Constitutions"],
        summary: "Delete a custom constitution",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Constitution deleted" },
          400: { description: "Cannot delete built-in constitution" }
        }
      }
    }
  },
  components: {
    schemas: {
      RoomState: {
        type: "object",
        properties: {
          roomId: { type: "string" },
          constitutionId: { type: "string" },
          judgePersona: { type: "string" },
          phase: { type: "string", enum: ["LOBBY", "FILING", "ROUND_1_OPENING", "ROUND_2_REBUTTAL", "ROUND_3_CLOSING", "DELIBERATION", "VERDICT_REVEALED"] },
          turnIndex: { type: "integer" },
          activeTurnSide: { type: "string", enum: ["petitioner", "respondent"] },
          turnSecondsRemaining: { type: "integer" },
          participants: {
            type: "object",
            properties: {
              petitioner: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  credibility: { type: "integer" },
                  connected: { type: "boolean" }
                }
              },
              respondent: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  credibility: { type: "integer" },
                  connected: { type: "boolean" }
                }
              }
            }
          },
          caseData: {
            type: "object",
            properties: {
              caseTitle: { type: "string" },
              facts: { type: "string" },
              reliefSought: { type: "string" },
              articlesInPlay: { type: "array", items: { type: "object" } },
              transcript: { type: "array", items: { type: "object" } },
              verdict: { type: "object" }
            }
          }
        }
      }
    }
  }
};

export function setupSwagger(app) {
  // Mount Swagger UI on /docs and /api-docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve raw JSON spec
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("[Swagger Bootstrap] Interactive API documentation active at /docs and /api-docs");
}
