const fs = require("fs");
const path = require("path");

function fail(msg) {
  process.stderr.write(`[configure] ${msg}\n`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeText(p, contents) {
  fs.writeFileSync(p, contents);
}

function assertAddress(addr, key) {
  if (typeof addr !== "string") fail(`${key}.address must be a string`);
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) fail(`${key}.address is not a 0x + 40 hex address: ${addr}`);
}

function assertStartBlock(n, key) {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) fail(`${key}.startBlock must be a non-negative number`);
}

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

function main() {
  const network = process.argv[2] || process.env.SUBGRAPH_NETWORK;
  if (!network) {
    fail("Usage: node scripts/configure.js <vechain-testnet|vechain-mainnet> (or set SUBGRAPH_NETWORK)");
  }

  const root = path.join(__dirname, "..");
  const networksPath = path.join(root, "networks.json");
  const templatePath = path.join(root, "subgraph.template.yaml");
  const outPath = path.join(root, "subgraph.yaml");

  const networks = readJson(networksPath);
  const cfg = networks[network];
  if (!cfg) {
    fail(`Unknown network '${network}'. Expected one of: ${Object.keys(networks).join(", ")}`);
  }

  const required = ["CleanupFactory", "UserRegistry", "RewardsManager", "AddressesProvider", "Streak"];
  for (const name of required) {
    if (!cfg[name]) fail(`networks.json missing '${network}.${name}'`);
    assertAddress(cfg[name].address, `${network}.${name}`);
    assertStartBlock(cfg[name].startBlock, `${network}.${name}`);
  }

  let out = readText(templatePath);
  out = replaceAll(out, "{{network}}", network);
  for (const name of required) {
    out = replaceAll(out, `{{${name}.address}}`, cfg[name].address);
    out = replaceAll(out, `{{${name}.startBlock}}`, String(cfg[name].startBlock));
  }

  writeText(outPath, out);
  process.stdout.write(`[configure] Wrote subgraph.yaml for network '${network}'\n`);
}

main();


