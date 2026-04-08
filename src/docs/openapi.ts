import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { alertSchema, createAlertSchema, listAlertsQuerySchema } from "../schemas/alert.js";
import { createIncidentSchema, incidentSchema, listIncidentsQuerySchema, patchIncidentStatusSchema } from "../schemas/incident.js";
import {
  createMaintenanceWindowSchema,
  listMaintenanceWindowsQuerySchema,
  maintenanceWindowSchema
} from "../schemas/maintenanceWindow.js";
import { teamSchema } from "../schemas/team.js";

extendZodWithOpenApi(z);

const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional()
});

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
});

const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema
  });

const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.string()
});

const idParamSchema = z.object({
  id: z.string()
});

const teamWorkloadSchema = z.object({
  team: teamSchema,
  openIncidents: z.number(),
  activeShifts: z.number(),
  activeMaintenanceWindows: z.number()
});

const kpisSchema = z.object({
  mttaMinutes: z.number().nullable(),
  mttrMinutes: z.number().nullable(),
  openCriticalIncidents: z.number(),
  alertVolume: z.object({
    last24h: z.number(),
    last7d: z.number(),
    last30d: z.number()
  })
});

function buildRegistry() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["System"],
    responses: {
      200: {
        description: "Health check",
        content: {
          "application/json": {
            schema: healthSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "get",
    path: "/incidents",
    tags: ["Incidents"],
    request: {
      query: listIncidentsQuerySchema
    },
    responses: {
      200: {
        description: "Paginated incidents",
        content: {
          "application/json": {
            schema: paginatedSchema(incidentSchema)
          }
        }
      },
      400: {
        description: "Invalid query",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "post",
    path: "/incidents",
    tags: ["Incidents"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createIncidentSchema
          }
        }
      }
    },
    responses: {
      201: {
        description: "Created incident",
        content: {
          "application/json": {
            schema: incidentSchema
          }
        }
      },
      400: {
        description: "Invalid body",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/incidents/{id}/status",
    tags: ["Incidents"],
    request: {
      params: idParamSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: patchIncidentStatusSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "Updated incident",
        content: {
          "application/json": {
            schema: incidentSchema
          }
        }
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      },
      404: {
        description: "Incident not found",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      },
      422: {
        description: "Invalid status transition",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "get",
    path: "/alerts",
    tags: ["Alerts"],
    request: {
      query: listAlertsQuerySchema
    },
    responses: {
      200: {
        description: "Paginated alerts",
        content: {
          "application/json": {
            schema: paginatedSchema(alertSchema)
          }
        }
      },
      400: {
        description: "Invalid query",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "post",
    path: "/alerts",
    tags: ["Alerts"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createAlertSchema
          }
        }
      }
    },
    responses: {
      201: {
        description: "Created alert",
        content: {
          "application/json": {
            schema: alertSchema
          }
        }
      },
      400: {
        description: "Invalid body",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      },
      404: {
        description: "Referenced incident not found",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "get",
    path: "/maintenance-windows",
    tags: ["Maintenance Windows"],
    request: {
      query: listMaintenanceWindowsQuerySchema
    },
    responses: {
      200: {
        description: "Paginated maintenance windows",
        content: {
          "application/json": {
            schema: paginatedSchema(maintenanceWindowSchema)
          }
        }
      },
      400: {
        description: "Invalid query",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "post",
    path: "/maintenance-windows",
    tags: ["Maintenance Windows"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createMaintenanceWindowSchema
          }
        }
      }
    },
    responses: {
      201: {
        description: "Created maintenance window",
        content: {
          "application/json": {
            schema: maintenanceWindowSchema
          }
        }
      },
      400: {
        description: "Invalid body",
        content: {
          "application/json": {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "get",
    path: "/teams/workload",
    tags: ["Teams"],
    responses: {
      200: {
        description: "Current workload by team",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(teamWorkloadSchema)
            })
          }
        }
      }
    }
  });

  registry.registerPath({
    method: "get",
    path: "/dashboard/kpis",
    tags: ["Dashboard"],
    responses: {
      200: {
        description: "Dashboard KPIs",
        content: {
          "application/json": {
            schema: kpisSchema
          }
        }
      }
    }
  });

  return registry;
}

const cachedDocuments = new Map<number, ReturnType<OpenApiGeneratorV31["generateDocument"]>>();

export function getOpenApiDocument(port = 4300) {
  const cachedDocument = cachedDocuments.get(port);
  if (cachedDocument) return cachedDocument;

  const registry = buildRegistry();
  const generator = new OpenApiGeneratorV31(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Operations Control Panel API",
      version: "1.0.0"
    },
    servers: [{ url: `http://localhost:${port}` }]
  });

  cachedDocuments.set(port, document);
  return document;
}

export function getSwaggerHtml(openApiUrl = "/openapi.json") {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Operations Control Panel API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body{margin:0;background:#fafafa}#swagger-ui{max-width:1200px;margin:0 auto}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "${openApiUrl}",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>`;
}
