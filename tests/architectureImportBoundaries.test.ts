import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const VIDEO_ROOT = path.resolve(process.cwd(), "src/video");

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getAllTsxFiles(fullPath));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?["']([^"']+)["']/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

test("Architecture: core/ layer never imports from topics/ or registry/", () => {
  const coreFiles = getAllTsxFiles(path.join(VIDEO_ROOT, "core"));
  for (const file of coreFiles) {
    const imports = extractImports(file);
    for (const imp of imports) {
      assert.ok(
        !imp.includes("/topics/") && !imp.startsWith("../topics"),
        `Core violation in ${path.relative(process.cwd(), file)}: illegal import from topics (${imp})`
      );
      assert.ok(
        !imp.includes("/registry/") && !imp.startsWith("../registry"),
        `Core violation in ${path.relative(process.cwd(), file)}: illegal import from registry (${imp})`
      );
    }
  }
});

test("Architecture: topic modules never import from peer topic modules", () => {
  const topicsDir = path.join(VIDEO_ROOT, "topics");
  const topicNames = fs
    .readdirSync(topicsDir)
    .filter((f) => fs.statSync(path.join(topicsDir, f)).isDirectory());

  for (const topic of topicNames) {
    const topicFiles = getAllTsxFiles(path.join(topicsDir, topic));
    const peerTopics = topicNames.filter((t) => t !== topic);

    for (const file of topicFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        for (const peer of peerTopics) {
          assert.ok(
            !imp.includes(`/${peer}/`) && !imp.includes(`/${peer}`) && !imp.endsWith(`/${peer}`),
            `Cross-topic violation in ${path.relative(process.cwd(), file)}: illegal import from peer topic '${peer}' (${imp})`
          );
        }
      }
    }
  }
});

test("Architecture: external layers only import topic modules through index boundaries", () => {
  const allVideoFiles = getAllTsxFiles(VIDEO_ROOT);
  const topicsDir = path.join(VIDEO_ROOT, "topics");
  const topicNames = fs
    .readdirSync(topicsDir)
    .filter((f) => fs.statSync(path.join(topicsDir, f)).isDirectory());

  for (const file of allVideoFiles) {
    // Skip files inside the topic itself
    const relativeToTopics = path.relative(topicsDir, file);
    const isInsideTopic = !relativeToTopics.startsWith("..");
    if (isInsideTopic) continue;

    const imports = extractImports(file);
    for (const imp of imports) {
      for (const topic of topicNames) {
        if (imp.includes(`topics/${topic}/`)) {
          // If it references a topic, it MUST be index.js or index
          const isIndexImport = imp.endsWith(`topics/${topic}/index.js`) || imp.endsWith(`topics/${topic}/index`);
          assert.ok(
            isIndexImport,
            `Private module violation in ${path.relative(process.cwd(), file)}: direct internal import from topic '${topic}' (${imp}). Must import only through public index.`
          );
        }
      }
    }
  }
});

