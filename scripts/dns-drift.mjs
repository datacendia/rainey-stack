/* DNS drift check — compare dns/expected.yml against the live Cloudflare
 * API and print anything that doesn't match.
 *
 * Usage:
 *   CF_API_TOKEN=… node scripts/dns-drift.mjs                     # all zones
 *   CF_API_TOKEN=… node scripts/dns-drift.mjs raineylaguna.com    # one zone
 *
 * The token must be a Cloudflare API Token (NOT the Global API Key)
 * with these scopes, restricted to your account and the relevant zones:
 *
 *   Zone — Zone — Read
 *   Zone — DNS  — Read
 *
 * Create at: https://dash.cloudflare.com/profile/api-tokens
 *
 * Exit codes:
 *   0  no drift
 *   1  drift detected (records present in CF but not in YAML, or
 *      records in YAML but not in CF, or value/proxied mismatch)
 *   2  configuration / API error
 *
 * The script does NOT modify Cloudflare. Apply changes by hand in the
 * dashboard, then update dns/expected.yml in the same PR.
 *
 * Per rainey-stack/STATUS.md row #28 + #40 and INFRA-SETUP.md.
 */

import fs from "node:fs";
import path from "node:path";

// Tiny YAML reader — depends only on Node's built-ins. Handles the
// subset our expected.yml uses (objects, arrays, scalars, comments,
// quoted strings). For anything fancier, add `yaml` as a devDep.
function parseYaml(text) {
  const lines = text.split(/\r?\n/);
  // Strip comments and empty lines for indentation analysis but keep
  // the original line numbers for error messages.
  const tokens = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const noComment = raw.replace(/\s+#.*$/u, "").replace(/^\s*#.*$/u, "");
    if (!noComment.trim()) continue;
    const indent = noComment.match(/^(\s*)/)[1].length;
    tokens.push({ indent, text: noComment.trimEnd(), line: i + 1 });
  }

  let cursor = 0;
  function parseValue(indent) {
    if (cursor >= tokens.length) return null;
    const t = tokens[cursor];
    if (t.indent < indent) return null;
    // Sequence
    if (t.text.trimStart().startsWith("- ")) {
      const arr = [];
      while (cursor < tokens.length) {
        const cur = tokens[cursor];
        if (cur.indent < indent || !cur.text.trimStart().startsWith("- ")) break;
        // Replace "- " with spaces of equal width so the rest reads as a map
        const inner = cur.text.replace(/^(\s*)- /, (_m, pad) => pad + "  ");
        tokens[cursor] = { ...cur, text: inner, indent: cur.indent + 2 };
        const item = parseValue(cur.indent + 2);
        arr.push(item);
      }
      return arr;
    }
    // Map
    if (/^\s*[A-Za-z_][\w-]*:/.test(t.text)) {
      const obj = {};
      while (cursor < tokens.length) {
        const cur = tokens[cursor];
        if (cur.indent < indent) break;
        if (cur.indent > indent) {
          // Belongs to previous key (handled inside the recursion below)
          break;
        }
        const m = cur.text.trimStart().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!m) {
          throw new Error(`Cannot parse line ${cur.line}: ${cur.text}`);
        }
        const key = m[1];
        const inline = m[2];
        cursor++;
        if (inline === "") {
          obj[key] = parseValue(cur.indent + 2);
        } else {
          obj[key] = parseScalar(inline);
        }
      }
      return obj;
    }
    // Lone scalar
    cursor++;
    return parseScalar(t.text.trim());
  }
  function parseScalar(s) {
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null" || s === "~" || s === "") return null;
    if (/^-?\d+$/.test(s)) return Number(s);
    if (/^-?\d+\.\d+$/.test(s)) return Number(s);
    if (/^"(.*)"$/.test(s)) return s.slice(1, -1);
    if (/^'(.*)'$/.test(s)) return s.slice(1, -1);
    return s;
  }
  return parseValue(0);
}

async function cfFetch(token, pathname, params = {}) {
  const url = new URL(`https://api.cloudflare.com/client/v4${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    const errs = (body.errors ?? []).map((e) => e.message).join("; ");
    throw new Error(
      `Cloudflare API ${res.status} ${pathname}: ${errs || res.statusText}`,
    );
  }
  return body.result;
}

async function getZoneId(token, name) {
  const zones = await cfFetch(token, "/zones", { name });
  if (zones.length === 0) {
    throw new Error(`zone ${name} not found in this Cloudflare account`);
  }
  return zones[0].id;
}

async function getRecords(token, zoneId) {
  const out = [];
  let page = 1;
  while (true) {
    const r = await cfFetch(token, `/zones/${zoneId}/dns_records`, {
      page,
      per_page: 100,
    });
    out.push(...r);
    if (r.length < 100) break;
    page++;
  }
  return out;
}

function key(rec) {
  return `${rec.type}|${rec.name}`.toLowerCase();
}

function normalizeName(zoneName, recordName) {
  if (recordName === "@") return zoneName;
  if (recordName.endsWith(`.${zoneName}`)) return recordName;
  return `${recordName}.${zoneName}`;
}

async function compareZone(token, zone) {
  const zoneId = await getZoneId(token, zone.name);
  const live = await getRecords(token, zoneId);
  const liveByKey = new Map(live.map((r) => [key(r), r]));

  const expected = (zone.records ?? []).map((r) => ({
    ...r,
    name: normalizeName(zone.name, r.name),
  }));
  const expectedKeys = new Set(expected.map((r) => key(r)));

  const missing = [];      // expected but not in CF
  const extra = [];        // in CF but not expected
  const mismatched = [];

  for (const exp of expected) {
    const live = liveByKey.get(key(exp));
    if (!live) {
      missing.push(exp);
      continue;
    }
    const valueMatch =
      live.content === exp.value ||
      live.content === `${exp.value}.` ||
      `${live.content}.` === exp.value;
    const proxiedMatch = (live.proxied ?? false) === !!exp.proxied;
    if (!valueMatch || !proxiedMatch) {
      mismatched.push({ expected: exp, live });
    }
  }
  for (const liveRec of live) {
    if (!expectedKeys.has(key(liveRec))) {
      // NS records on the apex are managed by CF and never appear in YAML;
      // ignore them to avoid false-positive drift.
      if (liveRec.type === "NS" && liveRec.name === zone.name) continue;
      // SOA on apex is also CF-managed.
      if (liveRec.type === "SOA" && liveRec.name === zone.name) continue;
      extra.push(liveRec);
    }
  }
  return { zone: zone.name, missing, extra, mismatched };
}

function fmt(rec) {
  const proxy = rec.proxied ? " (proxied)" : "";
  return `${rec.type} ${rec.name} → ${rec.value ?? rec.content}${proxy}`;
}

async function main() {
  const token = process.env.CF_API_TOKEN;
  if (!token) {
    console.error("CF_API_TOKEN is not set. Create one at https://dash.cloudflare.com/profile/api-tokens with Zone:Read + DNS:Read.");
    process.exit(2);
  }

  const yamlPath = path.resolve("dns/expected.yml");
  if (!fs.existsSync(yamlPath)) {
    console.error(`expected.yml not found at ${yamlPath}`);
    process.exit(2);
  }
  const config = parseYaml(fs.readFileSync(yamlPath, "utf8"));
  const zones = config?.zones ?? [];
  const onlyZone = process.argv[2];
  const targets = onlyZone ? zones.filter((z) => z.name === onlyZone) : zones;
  if (targets.length === 0) {
    console.error(`no matching zones (asked for ${onlyZone ?? "all"})`);
    process.exit(2);
  }

  let drifted = false;
  for (const z of targets) {
    let report;
    try {
      report = await compareZone(token, z);
    } catch (e) {
      console.error(`! ${z.name}: ${(e instanceof Error ? e.message : String(e))}`);
      process.exitCode = 2;
      continue;
    }
    console.log(`\n=== ${report.zone} ===`);
    if (report.missing.length === 0 && report.extra.length === 0 && report.mismatched.length === 0) {
      console.log("  in sync");
      continue;
    }
    drifted = true;
    if (report.missing.length) {
      console.log("  MISSING (declared in YAML, not in Cloudflare):");
      for (const r of report.missing) console.log(`    ${fmt(r)}`);
    }
    if (report.extra.length) {
      console.log("  EXTRA (in Cloudflare, not in YAML):");
      for (const r of report.extra) console.log(`    ${fmt(r)}`);
    }
    if (report.mismatched.length) {
      console.log("  MISMATCH (different value or proxied flag):");
      for (const m of report.mismatched) {
        console.log(`    expected: ${fmt(m.expected)}`);
        console.log(`    live:     ${fmt(m.live)}`);
      }
    }
  }

  if (drifted) {
    console.log("\nDrift detected. Either fix Cloudflare to match dns/expected.yml or update the YAML and commit.");
    process.exit(1);
  }
  console.log("\nAll zones in sync.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exit(2);
});
