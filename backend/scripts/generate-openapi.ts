import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../src/shared-kernel/openapi/registry.js";
import * as fs from "fs";
import * as path from "path";

// Extract --output parameter
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : "../contracts/openapi.json";

if (!outputPath) {
  console.error("Error: --output parameter requires a filepath value.");
  process.exit(1);
}

// Ensure the outputPath is absolute or resolved from the command invocation directory
const absoluteOutputPath = path.resolve(process.cwd(), outputPath);

const generator = new OpenApiGeneratorV3(registry.definitions);
const spec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Neighborhood Reports API",
    description: "API para el sistema de reportes y comités barriales.",
  },
});

// Ensure target directory exists
const dir = path.dirname(absoluteOutputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(absoluteOutputPath, JSON.stringify(spec, null, 2), "utf-8");
console.info(`[OpenAPI] Documentación generada con éxito en: ${absoluteOutputPath}`);
