/* eslint-disable no-console */
import { spawnSync } from "child_process";

const API_BASE = process.env.API_BASE_URL || "http://localhost:7101";
const COMPOSE_CMD = "docker compose -f docker/docker-compose.yml";

function run(command, args, opts = {}) {
  return spawnSync(command, args, { stdio: "inherit", ...opts });
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/healthz`);
    return res.ok;
  } catch {
    return false;
  }
}

function printHints() {
  console.log("\nTroubleshooting hints:");
  console.log("- Ensure backend is running and reachable at", API_BASE);
  console.log("- If using docker, run: docker compose -f docker/docker-compose.yml logs -f backend");
  console.log("- Ensure E2E_MODE=true for admin registration + cleanup disabled");
}

function tailBackendLogs() {
  try {
    console.log("\nLast 100 backend log lines:");
    run("sh", ["-c", `${COMPOSE_CMD} logs --tail 100 backend`]);
  } catch {
    console.log("\nUnable to fetch docker logs.");
  }
}

async function main() {
  const health = await checkHealth();
  if (!health) {
    console.log(`❌ API not reachable at ${API_BASE}`);
    printHints();
    process.exit(1);
  }

  console.log("✅ API reachable, running reset + smoke...\n");

  const reset = run("pnpm", ["--filter", "ideaapp-backend", "e2e:reset"], {
    env: { ...process.env, E2E_MODE: "true" },
  });
  if (reset.status !== 0) {
    console.log("\n❌ Reset failed");
    tailBackendLogs();
    printHints();
    process.exit(reset.status ?? 1);
  }

  const smoke = run("pnpm", ["--filter", "ideaapp-backend", "e2e:smoke"], {
    env: { ...process.env, E2E_MODE: "true", API_BASE_URL: API_BASE },
  });

  if (smoke.status !== 0) {
    console.log("\n❌ Smoke test failed");
    tailBackendLogs();
    printHints();
    process.exit(smoke.status ?? 1);
  }

  console.log("\n✅ VERIFY PASSED");
}

main();
