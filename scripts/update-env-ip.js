const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === "IPv4" &&
        !iface.internal &&
        !iface.address.startsWith("169.254")
      ) {
        return iface.address;
      }
    }
  }

  return "localhost";
}

const ip = getLocalIp();
const port = "3000";
const appUrl = `http://${ip}:${port}`;

console.log("");
console.log(`[update-env-ip] IP lokal terdeteksi : ${ip}`);
console.log(`[update-env-ip] APP_URL akan diset  : ${appUrl}`);

const envFile = path.resolve(__dirname, "../.env.local");

if (!fs.existsSync(envFile)) {
  console.error(`File .env.local tidak ditemukan di: ${envFile}`);
  process.exit(1);
}

let content = fs.readFileSync(envFile, "utf8");

function upsertEnv(key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
}

upsertEnv("APP_URL", appUrl);
upsertEnv("NEXT_PUBLIC_BASE_URL", appUrl);

fs.writeFileSync(envFile, content, "utf8");

console.log("[update-env-ip] .env.local berhasil diperbarui.");
console.log("");

process.env.NODE_OPTIONS = "--max-old-space-size=4096";

const concurrentlyBin = path.resolve(
  __dirname,
  "../node_modules/.bin/concurrently"
);

// const child = spawn(
//   concurrentlyBin,
//   [
//     "--kill-others",
//     "--names",
//     "NEXT,CRON",
//     "--prefix-colors",
//     "blue,yellow",
//     `node node_modules/next/dist/bin/next dev --hostname ${ip} --port ${port}`,
//     "node scripts/cron.js",
//   ],
//   {
//     cwd: path.resolve(__dirname, ".."),
//     stdio: "inherit",
//     shell: true,
//     env: process.env,
//   }
// );

const child = spawn(
  "npx",
  [
    "concurrently",
    "--kill-others",
    "--names",
    "NEXT,CRON",
    "--prefix-colors",
    "blue,yellow",
    `next dev --hostname ${ip} --port ${port}`,
    `node scripts/cron.js`,
  ],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: false,
    env: process.env,
  }
);

child.on("exit", (code) => {
  process.exit(code);
});