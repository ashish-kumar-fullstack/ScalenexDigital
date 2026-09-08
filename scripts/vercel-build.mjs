import { spawnSync } from "node:child_process";
function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: process.env,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
run("node_modules/next/dist/bin/next", ["build"]);
if (process.env.VERCEL_ENV === "production") {
  run("node_modules/tsx/dist/cli.mjs", ["scripts/seed.ts"]);
} else {
  console.log(
    "Automatic database initialization runs only for Vercel production deployments.",
  );
}
