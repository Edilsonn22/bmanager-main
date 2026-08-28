import { spawn } from "node:child_process";

const processo = spawn(process.execPath, ["--test", "tests/integration.test.js"], {
  stdio: "inherit",
  env: { ...process.env, RUN_INTEGRATION_TESTS: "1", NODE_ENV: "test" },
});

processo.on("exit", (codigo) => process.exit(codigo ?? 1));
