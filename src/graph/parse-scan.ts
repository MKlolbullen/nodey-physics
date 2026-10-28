import { indexChart, type Chart, type GraphEdge, type GraphNode } from "./data.ts";

export class ScanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanParseError";
  }
}

export type ScanImport = {
  chart: Chart;
  notice: string | null;
};

type RawPort = {
  proto: string;
  port: number;
  state: string;
  service: string;
  product: string;
  version: string;
  extra: string;
};

type RawHost = {
  ip: string;
  name: string;
  up: boolean;
  latency: string;
  mac: string;
  vendor: string;
  os: string;
  osRank: number;
  hops: string;
  ports: RawPort[];
};

const HOST_CAP = 120;
const PORT_CAP = 100;

let scanSeq = 0;

function emptyHost(ip: string, name: string): RawHost {
  return {
    ip,
    name,
    up: true,
    latency: "",
    mac: "",
    vendor: "",
    os: "",
    osRank: 0,
    hops: "",
    ports: [],
  };
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number(num)))
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&/g, "&");
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return decodeXml(match?.[2] ?? match?.[3] ?? "");
}

function isIpv4(value: string) {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return false;
  return value.split(".").every((part) => Number(part) <= 255);
}

function isIpv6(value: string) {
  const bare = value.split("%")[0] ?? "";
  if (!bare.includes(":") || !/^[0-9a-f:]+$/i.test(bare)) return false;
  const halves = bare.split("::");
  if (halves.length > 2) return false;
  const groups = bare.split(":").filter(Boolean).length;
  return halves.length === 2 ? groups <= 7 : groups === 8;
}

function isIp(value: string) {
  return isIpv4(value) || isIpv6(value);
}

function stripZone(value: string) {
  return value.split("%")[0] ?? value;
}

function isOpen(state: string) {
  const normalized = state.toLowerCase();
  return normalized === "open" || normalized === "open|filtered";
}

function cleanSvc(value: string) {
  return value.trim().replace(/\?+$/, "");
}

function setOs(host: RawHost, rank: number, value: string) {
  const next = value.trim().slice(0, 80);
  if (!next || next.toLowerCase() === "unknown") return;
  if (rank >= host.osRank) {
    host.os = next;
    host.osRank = rank;
  }
}

function addPort(host: RawHost, port: RawPort) {
  if (!Number.isInteger(port.port) || port.port < 1 || port.port > 65535) return;
  if (!isOpen(port.state)) return;
  const prev = host.ports.findIndex((item) => item.proto === port.proto && item.port === port.port);
  if (prev < 0) {
    host.ports.push(port);
    return;
  }
  const current = host.ports[prev];
  if (!current) return;
  const richer = [port.product, port.version, port.extra].join("").length;
  const poorer = [current.product, current.version, current.extra].join("").length;
  if (richer >= poorer) host.ports[prev] = port;
}

function shortenBanner(banner: string) {
  let text = banner.trim();
  const paren = text.indexOf(" (");
  if (paren > 0) text = text.slice(0, paren).trim();
  const parts = text.split(/\s+/).filter(Boolean);
  const versionAt = parts.findIndex((part) => /\d/.test(part));
  if (versionAt >= 0) return parts.slice(0, versionAt + 1).join(" ");
  return text;
}

function softLabel(port: RawPort) {
  const product = [port.product, port.version].filter(Boolean).join(" ").trim();
  if (product) return shortenBanner(product);
  if (port.extra && !port.service) return shortenBanner(port.extra);
  const service = cleanSvc(port.service);
  if (service && service.toLowerCase() !== "unknown") return service;
  return "";
}

function splitReport(rest: string) {
  const trimmed = rest.trim();
  const wrapped = trimmed.match(/^(.*?)(?:\s+\(([^)]+)\))\s*$/);
  if (wrapped?.[2]) {
    const left = wrapped[1]?.trim() ?? "";
    const inner = wrapped[2].trim();
    if (isIp(inner)) return { ip: stripZone(inner), name: left && left !== inner ? left : "" };
    if (isIp(left)) return { ip: stripZone(left), name: inner === left ? "" : inner };
    return { ip: "", name: left || inner };
  }
  if (isIp(trimmed)) return { ip: stripZone(trimmed), name: "" };
  return { ip: "", name: trimmed };
}

function hostKey(host: RawHost) {
  return (host.ip || host.name).toLowerCase();
}

function mergeHost(into: RawHost, extra: RawHost) {
  if (!into.ip && extra.ip) into.ip = extra.ip;
  if (!into.name && extra.name) into.name = extra.name;
  if (extra.up) into.up = true;
  if (!into.latency) into.latency = extra.latency;
  if (!into.mac) into.mac = extra.mac;
  if (!into.vendor) into.vendor = extra.vendor;
  if (!into.hops) into.hops = extra.hops;
  if (extra.os) setOs(into, extra.osRank, extra.os);
  for (const port of extra.ports) addPort(into, port);
}

function remember(map: Map<string, RawHost>, host: RawHost) {
  const key = hostKey(host);
  if (!key) return;
  const prev = map.get(key);
  if (!prev) map.set(key, host);
  else mergeHost(prev, host);
}

function parseXml(text: string) {
  const xml = text.replace(/<!--[\s\S]*?-->/g, "");
  const map = new Map<string, RawHost>();
  for (const match of xml.matchAll(/<host\b([^>]*)>([\s\S]*?)<\/host>/gi)) {
    const body = match[2] ?? "";
    const status = body.match(/<status\b([^>]*?)\/?>/i);
    const state = status ? attr(status[1] ?? "", "state") : "up";
    let ip = "";
    let mac = "";
    let vendor = "";
    for (const address of body.matchAll(/<address\b([^>]*?)\/?>/gi)) {
      const tag = address[1] ?? "";
      const addr = attr(tag, "addr");
      const kind = attr(tag, "addrtype").toLowerCase();
      if (kind === "mac") {
        mac = addr;
        vendor = attr(tag, "vendor");
      } else if (kind === "ipv4") ip = addr;
      else if ((kind === "ipv6" || isIp(addr)) && !ip) ip = stripZone(addr);
    }
    const names = [...body.matchAll(/<hostname\b([^>]*?)\/?>/gi)].map((host) => ({
      name: attr(host[1] ?? "", "name"),
      type: attr(host[1] ?? "", "type").toLowerCase(),
    }));
    const name = names.find((item) => item.type === "user" && item.name)?.name || names.find((item) => item.name)?.name || "";
    if (!ip && !name) continue;
    const host = emptyHost(ip, name);
    host.up = state.toLowerCase() !== "down";
    host.mac = mac;
    host.vendor = vendor;
    const times = body.match(/<times\b([^>]*?)\/?>/i);
    const srtt = Number(times ? attr(times[1] ?? "", "srtt") : "");
    if (Number.isFinite(srtt) && srtt > 0) {
      const ms = srtt / 1000;
      host.latency = `${ms >= 10 ? ms.toFixed(0) : ms.toFixed(1)} ms`;
    }
    const distance = body.match(/<distance\b([^>]*?)\/?>/i);
    if (distance) host.hops = attr(distance[1] ?? "", "value");
    const osmatch = body.match(/<osmatch\b([^>]*?)\/?>/i);
    if (osmatch?.[1]) setOs(host, 3, attr(osmatch[1], "name"));
    const ostypes = new Map<string, number>();
    for (const port of body.matchAll(/<port\b([^>]*)>([\s\S]*?)<\/port>/gi)) {
      const tag = port[1] ?? "";
      const inner = port[2] ?? "";
      const stateTag = inner.match(/<state\b([^>]*?)\/?>/i);
      const serviceTag = inner.match(/<service\b([^>]*?)\/?>/i);
      const serviceAttrs = serviceTag?.[1] ?? "";
      const ostype = attr(serviceAttrs, "ostype");
      if (ostype) ostypes.set(ostype, (ostypes.get(ostype) ?? 0) + 1);
      addPort(host, {
        proto: (attr(tag, "protocol") || "tcp").toLowerCase(),
        port: Number(attr(tag, "portid")),
        state: stateTag ? attr(stateTag[1] ?? "", "state") : "open",
        service: cleanSvc(attr(serviceAttrs, "name")),
        product: attr(serviceAttrs, "product"),
        version: attr(serviceAttrs, "version"),
        extra: attr(serviceAttrs, "extrainfo"),
      });
    }
    if (!host.os) {
      let best = "";
      let count = 0;
      for (const [label, n] of ostypes) {
        if (n > count) {
          best = label;
          count = n;
        }
      }
      if (best) setOs(host, 1, best);
    }
    if (host.up || host.ports.length) remember(map, host);
  }
  return [...map.values()];
}

function parseNormal(text: string) {
  const map = new Map<string, RawHost>();
  let current: RawHost | null = null;
  const flush = () => {
    if (!current) return;
    if (current.up || current.ports.length) remember(map, current);
    current = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^Nmap scan report for /i.test(line)) {
      flush();
      const parsed = splitReport(line.slice("Nmap scan report for ".length));
      current = emptyHost(parsed.ip, parsed.name);
      continue;
    }
    if (!current) continue;
    if (/^Nmap done\b/i.test(line) || /^# Nmap done\b/i.test(line) || line.startsWith("Read data files")) {
      flush();
      continue;
    }
    if (/^Host is down\b/i.test(line) || /Host seems down/i.test(line)) {
      current.up = false;
      continue;
    }
    if (/^Host is up\b/i.test(line)) {
      current.up = true;
      const latency = line.match(/\(([\d.]+)s latency\)/i);
      if (latency?.[1]) current.latency = `${latency[1]}s`;
      continue;
    }
    const port = line.match(/^(\d+)\/(tcp|udp|sctp)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/i);
    if (port) {
      addPort(current, {
        proto: (port[2] ?? "tcp").toLowerCase(),
        port: Number(port[1]),
        state: port[3] ?? "",
        service: cleanSvc(port[4] ?? ""),
        product: "",
        version: (port[5] ?? "").trim(),
        extra: "",
      });
      continue;
    }
    const details = line.match(/^OS details:\s*(.+)$/i);
    if (details?.[1]) {
      setOs(current, 3, details[1]);
      continue;
    }
    const running = line.match(/^Running:\s*(.+)$/i);
    if (running?.[1]) {
      setOs(current, 2, running[1]);
      continue;
    }
    const info = line.match(/^Service Info:\s*(.+)$/i);
    const infoOs = info?.[1]?.match(/\bOS:\s*([^;]+)/i);
    if (infoOs?.[1]) setOs(current, 1, infoOs[1]);
    const mac = line.match(/^MAC Address:\s*([0-9A-Fa-f:]{11,})(?:\s+\((.+)\))?\s*$/);
    if (mac?.[1]) {
      current.mac = mac[1];
      current.vendor = mac[2]?.trim() ?? "";
      continue;
    }
    const hops = line.match(/^Network Distance:\s*(\d+)/i);
    if (hops?.[1]) current.hops = hops[1];
  }
  flush();
  return [...map.values()];
}

function parseGnmap(text: string) {
  const map = new Map<string, RawHost>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const match = line.match(/^Host:\s+(\S+)\s+\(([^)]*)\)\s*(.*)$/i);
    if (!match) continue;
    const ip = isIp(match[1] ?? "") ? stripZone(match[1] ?? "") : "";
    const name = (match[2] ?? "").trim();
    if (!ip && !name && !isIp(match[1] ?? "")) continue;
    const host = emptyHost(ip || (isIp(match[1] ?? "") ? stripZone(match[1] ?? "") : ""), name === ip ? "" : name);
    const rest = match[3] ?? "";
    const status = rest.match(/Status:\s*(\S+)/i);
    if (status?.[1] && status[1].toLowerCase() !== "up") host.up = false;
    const os = rest.match(/(?:^|\t)OS:\s*([^\t]+)/i);
    if (os?.[1]) setOs(host, 3, os[1]);
    const ports = rest.match(/Ports:\s*([^\t]+)/i);
    if (ports?.[1]) {
      for (const entry of ports[1].split(/,\s+(?=\d+\/)/)) {
        const fields = entry.trim().match(/^(\d+)\/([^/]*)\/([^/]*)\/([^/]*)\/([^/]*)\/([^/]*)\/(.*)$/);
        if (!fields) continue;
        addPort(host, {
          port: Number(fields[1]),
          state: fields[2] ?? "",
          proto: (fields[3] || "tcp").toLowerCase(),
          service: cleanSvc(fields[5] ?? ""),
          product: "",
          version: (fields[7] ?? "").replace(/\/+$/, "").trim(),
          extra: "",
        });
      }
    }
    if (host.up || host.ports.length) remember(map, host);
  }
  return [...map.values()];
}

function parseDelimited(text: string, delim: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delim) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim()));
}

const COLUMN_ALIAS: Record<string, string[]> = {
  ip: ["ip", "ip address", "ipaddress", "ip_address", "ipv4", "ipv6", "address"],
  host: ["hostname", "host name", "host_name", "dns", "fqdn", "host", "target"],
  port: ["port", "portid", "port id", "port_id"],
  proto: ["protocol", "proto", "transport"],
  state: ["state", "port state", "port_state"],
  service: ["service", "service name", "service_name", "svc"],
  product: ["product", "software", "banner", "application", "app"],
  version: ["version", "ver", "product version", "service version"],
  os: ["os", "ostype", "os type", "operating system", "os details"],
  mac: ["mac", "mac address", "mac_address"],
};

function headerIndex(cells: string[]) {
  const normalized = cells.map((cell) => cell.trim().toLowerCase().replace(/\s+/g, " "));
  const known = new Set(Object.values(COLUMN_ALIAS).flat());
  if (!normalized.some((cell) => known.has(cell) || cell === "status" || cell === "name")) return null;
  const cols: Record<string, number> = {};
  normalized.forEach((cell, index) => {
    if (cell === "status") return;
    for (const [field, aliases] of Object.entries(COLUMN_ALIAS)) {
      if (cols[field] === undefined && aliases.includes(cell)) cols[field] = index;
    }
  });
  const statusAt = normalized.indexOf("status");
  if (statusAt >= 0 && cols.state === undefined) cols.status = statusAt;
  if (cols.host === undefined) {
    const nameAt = normalized.indexOf("name");
    if (nameAt >= 0) cols[cols.port !== undefined && cols.service === undefined ? "service" : "host"] = nameAt;
  }
  return cols;
}

function splitHostPort(value: string) {
  const bracket = value.match(/^\[(.+)\]:(\d+)$/);
  if (bracket?.[1] && bracket[2]) return { host: bracket[1], port: bracket[2] };
  const v4 = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d+)$/);
  if (v4?.[1] && v4[2]) return { host: v4[1], port: v4[2] };
  return null;
}

function parseCsv(text: string) {
  const first = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const commas = (first.match(/,/g) ?? []).length;
  const semis = (first.match(/;/g) ?? []).length;
  const tabs = (first.match(/\t/g) ?? []).length;
  const delim = tabs > commas && tabs > semis ? "\t" : semis > commas ? ";" : ",";
  const table = parseDelimited(text, delim);
  if (!table.length) return [];
  const header = headerIndex(table[0] ?? []);
  let cols: Record<string, number>;
  if (header) cols = header;
  else {
    const sample = (table[0] ?? []).map((cell) => cell.trim());
    const first = sample[0] ?? "";
    const combo = splitHostPort(first);
    if (!isIp(first) && !(combo && isIp(combo.host))) return [];
    if (sample.length === 1) cols = { ip: 0 };
    else if (/^\d+$/.test(sample[1] ?? "") || combo) cols = { ip: 0, port: 1, proto: 2, service: 3, product: 4, version: 5 };
    else cols = { ip: 0, host: 1, port: 2, proto: 3, service: 4, product: 5, version: 6 };
  }
  const data = header ? table.slice(1) : table;
  if (cols.status !== undefined) {
    const values = data.map((row) => (row[cols.status ?? -1] ?? "").trim().toLowerCase());
    if (values.some((value) => /open|closed|filtered/.test(value)) && cols.state === undefined) {
      cols.state = cols.status;
    }
  }
  const map = new Map<string, RawHost>();
  const cell = (row: string[], field: string) => (cols[field] === undefined ? "" : (row[cols[field] ?? -1] ?? "").trim());
  for (const row of data) {
    let ip = cell(row, "ip");
    let name = cell(row, "host");
    let portText = cell(row, "port");
    for (const slot of ["ip", "host"] as const) {
      const raw = slot === "ip" ? ip : name;
      const combo = splitHostPort(raw);
      if (!combo) continue;
      if (!portText) portText = combo.port;
      if (slot === "ip") ip = combo.host;
      else name = combo.host;
    }
    if (isIp(name) && !ip) {
      ip = name;
      name = "";
    } else if (ip && !isIp(ip) && !name) {
      name = ip;
      ip = "";
    }
    if (ip) ip = stripZone(ip);
    if (name === ip) name = "";
    if (!ip && !name) continue;
    const state = cell(row, "state").toLowerCase();
    const status = cols.status !== undefined && cols.state !== cols.status ? cell(row, "status").toLowerCase() : "";
    const portNum = Number(portText);
    const hasPort = Number.isInteger(portNum) && portNum > 0 && portNum < 65536;
    const explicitUp = status === "up";
    const explicitDown = status === "down";
    const os = cell(row, "os");
    const host = emptyHost(ip, name);
    if (os) setOs(host, 3, os);
    host.mac = cell(row, "mac");
    if (hasPort && state && !isOpen(state)) {
      if (explicitUp) remember(map, host);
      continue;
    }
    if (explicitDown && !hasPort) continue;
    if (explicitDown) host.up = false;
    if (hasPort) {
      addPort(host, {
        port: portNum,
        proto: (cell(row, "proto") || "tcp").toLowerCase(),
        state: state || "open",
        service: cleanSvc(cell(row, "service")),
        product: cell(row, "product"),
        version: cell(row, "version"),
        extra: "",
      });
    }
    if (host.up || host.ports.length) remember(map, host);
  }
  return [...map.values()].filter((host) => host.up || host.ports.length);
}

function parseIpList(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (!lines.length || !lines.every((line) => isIp(line))) return [];
  const map = new Map<string, RawHost>();
  for (const line of lines) remember(map, emptyHost(stripZone(line), ""));
  return [...map.values()];
}

function fileStem(filename: string) {
  const base = filename.split(/[/\\]/).pop() || "Scan";
  return base.replace(/\.[^.]+$/, "").slice(0, 42) || "Scan";
}

function netOf(ip: string) {
  if (isIpv4(ip)) {
    const [a, b, c] = ip.split(".");
    return { id: `net:v4:${a}.${b}.${c}`, label: `${a}.${b}.${c}.0/24` };
  }
  if (isIpv6(ip)) {
    const bare = ip.toLowerCase();
    const left = bare.includes("::") ? (bare.split("::")[0] ?? "") : bare;
    const bits = left.split(":").filter(Boolean).slice(0, 4);
    const prefix = bits.join(":");
    return {
      id: `net:v6:${prefix || "v6"}`,
      label: prefix ? `${prefix}::/64` : "IPv6",
    };
  }
  return { id: "net:names", label: "Named hosts" };
}

function portLine(port: RawPort) {
  const ident = softLabel(port);
  return [`${port.port}/${port.proto}`, port.service, ident && ident !== port.service ? ident : ""]
    .filter(Boolean)
    .join("  ");
}

function seenBlurb(os: boolean, count: number) {
  const hosts = count === 1 ? "1 host" : `${count} hosts`;
  return os ? `Operating system on ${hosts}.` : `Seen on ${hosts}.`;
}

function toChart(hosts: RawHost[], filename: string): ScanImport {
  const ready = hosts
    .map((host) => ({ ...host, ports: host.ports.filter((port) => isOpen(port.state)) }))
    .filter((host) => (host.ip || host.name) && (host.up || host.ports.length));
  if (!ready.length) throw new ScanParseError("No up hosts in that scan.");

  let list = ready;
  const notices: string[] = [];
  if (list.length > HOST_CAP) {
    const ranked = list.map((host, index) => ({ host, index }));
    ranked.sort((a, b) => b.host.ports.length - a.host.ports.length || a.index - b.index);
    const keep = new Set(ranked.slice(0, HOST_CAP).map((item) => item.host));
    const dropped = list.length - HOST_CAP;
    list = list.filter((host) => keep.has(host));
    notices.push(`Showing ${HOST_CAP} hosts with the most open ports. ${dropped} were left out.`);
  }

  const openCount = list.reduce((sum, host) => sum + host.ports.length, 0);
  const drawPorts = openCount <= PORT_CAP;
  if (!drawPorts && openCount > 0) {
    notices.push("Too many open ports to draw. They are listed on each host, and shared software still ties them together.");
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeId = 0;
  const link = (source: string, target: string, label: string) => {
    edges.push({ id: `e${edgeId}`, source, target, label });
    edgeId += 1;
  };

  const nets = new Map<string, { id: string; label: string; hosts: string[] }>();
  const softHosts = new Map<string, { id: string; label: string; os: boolean; hosts: Set<string> }>();

  const ensureSoft = (label: string, os: boolean) => {
    const key = `${os ? "os" : "svc"}:${label.toLowerCase().replace(/\s+/g, " ").slice(0, 80)}`;
    const id = `soft:${key}`;
    let soft = softHosts.get(id);
    if (!soft) {
      soft = { id, label: label.slice(0, 64), os, hosts: new Set() };
      softHosts.set(id, soft);
    }
    return soft;
  };

  for (const host of list) {
    const id = `host:${(host.ip || host.name).toLowerCase()}`;
    const label = host.name && host.name !== host.ip ? host.name : host.ip || host.name;
    const openN = host.ports.length;
    const blurb = [host.name && host.ip && host.name !== host.ip ? host.ip : "", openN ? `${openN} open` : "up, no open ports"]
      .filter(Boolean)
      .join(" · ");
    const facts: { k: string; v: string }[] = [];
    if (host.ip) facts.push({ k: "Address", v: host.ip });
    if (host.latency) facts.push({ k: "Latency", v: host.latency });
    if (host.mac) facts.push({ k: "MAC", v: host.vendor ? `${host.mac} (${host.vendor})` : host.mac });
    if (host.os) facts.push({ k: "OS", v: host.os });
    if (host.hops) facts.push({ k: "Hops", v: host.hops });
    facts.push({ k: "Open", v: String(openN) });
    let notes = "";
    if (!openN) notes = "Nothing in this scan answered on an open port.";
    else if (!drawPorts) {
      const lines = host.ports.map(portLine);
      const shown = lines.slice(0, 40);
      notes = shown.join("\n");
      if (lines.length > shown.length) notes += `\n… ${lines.length - shown.length} more`;
    }
    nodes.push({ id, label, kind: "host", blurb, notes, facts });

    const net = host.ip ? netOf(host.ip) : { id: "net:names", label: "Named hosts" };
    const bucket = nets.get(net.id) ?? { ...net, hosts: [] };
    bucket.hosts.push(id);
    nets.set(net.id, bucket);
    link(net.id, id, "holds");

    if (host.os) {
      const soft = ensureSoft(host.os, true);
      soft.hosts.add(id);
      link(id, soft.id, "runs");
    }

    const folded = new Map<string, string[]>();
    for (const port of [...host.ports].sort((a, b) => a.port - b.port || a.proto.localeCompare(b.proto))) {
      const ident = softLabel(port);
      if (drawPorts) {
        const portId = `port:${id.slice("host:".length)}:${port.proto}:${port.port}`;
        const banner = [port.product, port.version, port.extra].filter(Boolean).join(" ").trim();
        const portFacts: { k: string; v: string }[] = [{ k: "State", v: port.state }];
        if (port.service) portFacts.push({ k: "Service", v: port.service });
        if (banner) portFacts.push({ k: "Banner", v: banner });
        nodes.push({
          id: portId,
          label: `${port.port}/${port.proto}`,
          kind: "port",
          blurb: ident || port.service || port.state,
          notes: "",
          facts: portFacts,
        });
        link(id, portId, "exposes");
        if (ident) {
          const soft = ensureSoft(ident, false);
          soft.hosts.add(id);
          link(portId, soft.id, "runs");
        }
      } else if (ident) {
        const soft = ensureSoft(ident, false);
        soft.hosts.add(id);
        const listPorts = folded.get(soft.id) ?? [];
        listPorts.push(`${port.port}/${port.proto}`);
        folded.set(soft.id, listPorts);
      }
    }
    for (const [softId, ports] of folded) {
      const label = ports.length <= 3 ? ports.join(" · ") : `${ports.slice(0, 2).join(" · ")} +${ports.length - 2}`;
      link(id, softId, label);
    }
  }

  const netNodes: GraphNode[] = [...nets.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((net) => ({
      id: net.id,
      label: net.label,
      kind: "net" as const,
      blurb: net.hosts.length === 1 ? "1 host" : `${net.hosts.length} hosts`,
      notes: "Hosts in this scan that share the prefix.",
      facts: [
        { k: "Prefix", v: net.label },
        { k: "Hosts", v: String(net.hosts.length) },
      ],
    }));

  const softNodes: GraphNode[] = [...softHosts.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((soft) => ({
      id: soft.id,
      label: soft.label,
      kind: "soft" as const,
      blurb: seenBlurb(soft.os, soft.hosts.size),
      notes: soft.os ? "Taken from the scan's OS match." : "Same product, version, or service name on more than one port collapses here.",
      facts: [
        { k: "Kind", v: soft.os ? "OS" : "Software" },
        { k: "Hosts", v: String(soft.hosts.size) },
      ],
    }));

  const hostNodes = nodes.filter((node) => node.kind === "host");
  const portNodes = nodes.filter((node) => node.kind === "port");
  const ordered = [...netNodes, ...hostNodes, ...portNodes, ...softNodes];

  return {
    chart: indexChart({
      id: `scan:${++scanSeq}`,
      kicker: fileStem(filename),
      blurb: "A network holds its hosts, a host exposes ports, and those ports run software. Read only in this tab.",
      nodes: ordered,
      edges,
    }),
    notice: notices.length ? notices.join(" ") : null,
  };
}

function looksNormal(text: string) {
  return /^Nmap scan report for /im.test(text);
}

function looksGnmap(text: string) {
  return /^Host:\s+\S+\s+\(/im.test(text) && /Ports:|Status:/i.test(text);
}

function looksXml(text: string) {
  return /<nmaprun[\s>]/i.test(text) || (/<host[\s>]/i.test(text) && /<address[\s>]/i.test(text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function textOf(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pathnameOf(url: string) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "";
  }
}

function fileLabelOf(url: string) {
  const base = pathnameOf(url).split("/").filter(Boolean).pop() || url;
  return base.length > 56 ? `${base.slice(0, 53)}…` : base;
}

function portFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.port) return Number(parsed.port);
    if (parsed.protocol === "https:") return 443;
    if (parsed.protocol === "http:") return 80;
  } catch {
    return 0;
  }
  return 0;
}

function addFact(node: GraphNode, k: string, v: string) {
  const facts = node.facts as { k: string; v: string }[];
  if (!facts.some((fact) => fact.k === k && fact.v === v)) facts.push({ k, v });
}

function attachMeridian(base: ScanImport, data: Record<string, unknown>): ScanImport {
  const nodes: GraphNode[] = base.chart.nodes.map((node) => ({ ...node, facts: [...node.facts] }));
  const edges: GraphEdge[] = base.chart.edges.map((edge) => ({ ...edge }));
  const notices = base.notice ? [base.notice] : [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let edgeId = edges.length;
  const link = (source: string, target: string, label: string) => {
    if (!byId.has(source) || !byId.has(target)) return;
    if (edges.some((edge) => edge.source === source && edge.target === target && edge.label === label)) return;
    edges.push({ id: `e${edgeId}`, source, target, label });
    edgeId += 1;
  };

  const crawled = new Map<string, string[]>();
  const titles = new Map<string, string>();
  for (const page of Array.isArray(data.pages) ? data.pages.filter(isRecord) : []) {
    const ip = textOf(page.ip).toLowerCase();
    const path = pathnameOf(textOf(page.url));
    if (ip && path) {
      const list = crawled.get(ip) ?? [];
      if (!list.includes(path)) list.push(path);
      crawled.set(ip, list);
    }
    const title = textOf(page.title);
    if (ip && title && !titles.has(ip)) titles.set(ip, title);
  }
  for (const [ip, paths] of crawled) {
    const host = byId.get(`host:${ip}`);
    if (!host) continue;
    const line = `Crawled ${paths.slice(0, 12).join("  ")}`;
    host.notes = host.notes ? `${host.notes}\n${line}` : line;
    const title = titles.get(ip);
    if (title) addFact(host, "Title", title.slice(0, 80));
  }

  for (const rec of Array.isArray(data.dns) ? data.dns.filter(isRecord) : []) {
    const type = textOf(rec.type).toUpperCase();
    const name = textOf(rec.name);
    const value = textOf(rec.value);
    if (!type || !name || !value) continue;
    const host =
      type === "PTR" && isIp(name)
        ? byId.get(`host:${stripZone(name).toLowerCase()}`)
        : (type === "A" || type === "AAAA") && isIp(value)
          ? byId.get(`host:${stripZone(value).toLowerCase()}`)
          : undefined;
    if (!host || host.facts.length > 12) continue;
    if (type === "PTR") addFact(host, "PTR", value);
    if ((type === "A" || type === "AAAA") && host.label !== name) addFact(host, type, name);
  }

  const groups = new Map<string, { label: string; kind: string; hosts: Set<string>; sources: Set<string>; url: string }>();
  let skipped = 0;
  const files = (Array.isArray(data.files) ? data.files.filter(isRecord) : [])
    .map((file) => ({
      url: textOf(file.url),
      kind: textOf(file.kind).toLowerCase(),
      status: Number(file.status),
      ip: textOf(file.ip).toLowerCase(),
    }))
    .filter((file) => file.url && isIp(file.ip) && file.status >= 200 && file.status < 400);
  for (const file of files) {
    const key = pathnameOf(file.url).toLowerCase();
    if (!key) continue;
    let group = groups.get(key);
    if (!group) {
      if (groups.size >= 80) {
        skipped += 1;
        continue;
      }
      group = {
        label: fileLabelOf(file.url),
        kind: file.kind || "file",
        hosts: new Set(),
        sources: new Set(),
        url: file.url,
      };
      groups.set(key, group);
    }
    group.hosts.add(file.ip);
    const port = portFromUrl(file.url);
    const portId = port ? `port:${file.ip}:tcp:${port}` : "";
    const source = byId.has(portId) ? portId : `host:${file.ip}`;
    if (byId.has(source)) group.sources.add(source);
  }
  if (skipped) notices.push(`${skipped} more script files were left off the chart.`);

  for (const [key, group] of groups) {
    if (!group.sources.size) continue;
    const id = `file:${key}`;
    const count = group.hosts.size;
    const node: GraphNode = {
      id,
      label: group.label,
      kind: "file",
      blurb: count === 1 ? "Served by 1 host." : `Served by ${count} hosts.`,
      notes: group.url,
      facts: [
        { k: "Kind", v: group.kind },
        { k: "Hosts", v: String(count) },
      ],
    };
    nodes.push(node);
    byId.set(id, node);
    for (const source of group.sources) link(source, id, "serves");
  }

  return {
    chart: indexChart({
      id: base.chart.id,
      kicker: base.chart.kicker,
      blurb: nodes.some((node) => node.kind === "file")
        ? "A network holds its hosts, a host exposes ports, those ports run software, and web ports serve the script files they share."
        : base.chart.blurb,
      nodes,
      edges,
    }),
    notice: notices.length ? notices.join(" ") : null,
  };
}

function asMeridian(raw: string, filename: string): ScanImport | null {
  if (!raw.startsWith("{")) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.meridian !== 1 || !Array.isArray(data.hosts)) return null;
  const hosts: RawHost[] = [];
  for (const item of data.hosts) {
    if (!isRecord(item)) continue;
    const ip = textOf(item.ip);
    const names = Array.isArray(item.names) ? item.names.map(textOf).filter(Boolean) : [];
    const host = emptyHost(isIp(ip) ? stripZone(ip) : "", names[0] ?? "");
    if (!host.ip && !host.name) continue;
    host.up = item.up !== false;
    if (Array.isArray(item.ports)) {
      for (const port of item.ports) {
        if (!isRecord(port)) continue;
        addPort(host, {
          port: Number(port.port),
          proto: textOf(port.proto).toLowerCase() || "tcp",
          state: textOf(port.state) || "open",
          service: cleanSvc(textOf(port.service)),
          product: textOf(port.product),
          version: textOf(port.version),
          extra: "",
        });
      }
    }
    if (host.up || host.ports.length) hosts.push(host);
  }
  if (!hosts.length) throw new ScanParseError("No up hosts in that scan.");
  return attachMeridian(toChart(hosts, filename), data);
}

export function parseScan(text: string, filename: string): ScanImport {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) throw new ScanParseError("That file is empty.");
  const ext = (filename.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();

  if (ext === "json" || raw.startsWith("{")) {
    const imported = asMeridian(raw, filename);
    if (imported) return imported;
    if (ext === "json") throw new ScanParseError("That JSON is not a Meridian scan.");
  }

  if (ext === "xml" || looksXml(raw)) {
    const hosts = parseXml(raw);
    if (!hosts.length) throw new ScanParseError("No hosts in that XML.");
    return toChart(hosts, filename);
  }
  if (ext === "gnmap" || (ext !== "nmap" && looksGnmap(raw))) {
    const hosts = parseGnmap(raw);
    if (!hosts.length) throw new ScanParseError("No up hosts in that grepable scan.");
    return toChart(hosts, filename);
  }
  if (ext === "nmap" || looksNormal(raw)) {
    const hosts = parseNormal(raw);
    if (hosts.length) return toChart(hosts, filename);
    const grepable = parseGnmap(raw);
    if (grepable.length) return toChart(grepable, filename);
    throw new ScanParseError("No up hosts in that Nmap report.");
  }
  if (ext === "csv" || ext === "txt" || raw.includes(",") || raw.includes(";") || raw.includes("\t")) {
    const hosts = parseCsv(raw);
    if (hosts.length) return toChart(hosts, filename);
  }
  const listed = parseIpList(raw);
  if (listed.length) return toChart(listed, filename);
  throw new ScanParseError(
    "No hosts found. Use Nmap XML (-oX), normal output (-oN), grepable (-oG), a CSV with an IP column, or a Meridian scan JSON.",
  );
}

export const SAMPLE_SCAN = `# Nmap 7.94 scan initiated Tue Oct 28 12:00:00 2026
Nmap scan report for gateway.lab (10.10.10.1)
Host is up (0.0011s latency).
Not shown: 997 closed tcp ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
53/tcp open  domain  dnsmasq 2.90
80/tcp open  http    nginx 1.24.0
MAC Address: 00:11:22:33:44:55 (Lab)
OS details: Linux 5.15
Network Distance: 1 hop

Nmap scan report for files.lab (10.10.10.20)
Host is up (0.0020s latency).
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
139/tcp  open  netbios Samba smbd 4.15.3
445/tcp  open  smb     Samba smbd 4.15.3
8080/tcp open  http    nginx 1.24.0
OS details: Linux 5.15

Nmap scan report for win-dc.lab (10.10.10.10)
Host is up (0.004s latency).
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos
135/tcp  open  msrpc         Microsoft Windows RPC
445/tcp  open  microsoft-ds  Microsoft Windows SMB
3389/tcp open  ms-wbt-server Microsoft Terminal Services
OS details: Windows Server 2022

Nmap scan report for jump.lab (10.10.10.30)
Host is up (0.006s latency).
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 9.6p1
443/tcp open  ssl/http nginx 1.24.0
OS details: Linux 6.8

Nmap scan report for 10.10.10.50
Host is up (0.008s latency).
All 1000 scanned ports on 10.10.10.50 are closed

Nmap done: 256 IP addresses (5 hosts up) scanned in 4.21 seconds
`;
