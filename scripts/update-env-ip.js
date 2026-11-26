const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  if (!interfaces) return "localhost";

  // 1. Pola nama adapter fisik yang diprioritaskan
  const preferredPatterns = [
    /^Ethernet/i,
    /^Wi-Fi/i,
    /^WLAN/i,
    /^Local Area Connection/i,
    /^en\d/i,      // macOS/Linux (en0, en1)
    /^eth\d/i,     // Linux (eth0)
    /^wlan\d/i     // Linux (wlan0)
  ];

  // 2. Pola nama adapter virtual yang HARUS diabaikan
  const virtualPatterns = [
    /^vEthernet/i,
    /^VMware/i,
    /^VirtualBox/i,
    /^Hyper-V/i,
    /^WSL/i,
    /^docker/i,
    /^br-/i,
    /^vnet/i,
    /^utun/i,
    /^awdl/i,
    /^llw/i
  ];

  let fallbackIp = "localhost";

  for (const name of Object.keys(interfaces)) {
    // Abaikan jika nama adapter cocok dengan pola virtual
    if (virtualPatterns.some(pattern => pattern.test(name))) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (
        (iface.family === "IPv4" || iface.family === 4) && // Support Node.js v18+
        !iface.internal &&
        !iface.address.startsWith("169.254") // Abaikan link-local IP
      ) {
        // Jika ini adalah adapter fisik yang diprioritaskan, langsung gunakan
        if (preferredPatterns.some(pattern => pattern.test(name))) {
          return iface.address;
        }
        
        // Jika bukan prioritas utama, simpan sebagai cadangan (fallback)
        fallbackIp = iface.address;
      }
    }
  }

  return fallbackIp;
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

const child = spawn(
  process.execPath,
  [
    path.resolve(__dirname, "../node_modules/concurrently/dist/bin/concurrently.js"),
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