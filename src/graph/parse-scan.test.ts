import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchChart, tiesOf } from "./data.ts";
import { SAMPLE_SCAN, ScanParseError, parseScan } from "./parse-scan.ts";

describe("parseScan", () => {
  it("builds shared software and subnet ties from nmap normal output", () => {
    const { chart, notice } = parseScan(SAMPLE_SCAN, "lab-scan.nmap");
    assert.equal(notice, null);
    assert.equal(chart.kicker, "lab-scan");
    assert.equal(chart.nodes.filter((node) => node.kind === "host").length, 5);

    const nginx = chart.nodes.find((node) => node.label === "nginx 1.24.0");
    assert.ok(nginx);
    assert.equal(nginx.blurb, "Seen on 3 hosts.");
    assert.equal(chart.degree.get(nginx.id), 3);
    assert.ok(tiesOf(chart, nginx.id).every((tie) => tie.other.kind === "port"));

    const ssh = chart.nodes.find((node) => node.label === "OpenSSH 8.9p1");
    assert.ok(ssh);
    assert.equal(chart.degree.get(ssh.id), 2);
    assert.equal(chart.nodes.filter((node) => node.label === "OpenSSH 9.6p1").length, 1);

    const samba = chart.nodes.find((node) => node.label === "Samba smbd 4.15.3");
    assert.ok(samba);
    assert.equal(samba.blurb, "Seen on 1 host.");
    assert.equal(chart.degree.get(samba.id), 2);

    const net = chart.nodes.find((node) => node.kind === "net");
    assert.ok(net);
    assert.equal(net.label, "10.10.10.0/24");
    assert.equal(chart.degree.get(net.id), 5);

    const linux = chart.nodes.find((node) => node.label === "Linux 5.15");
    assert.equal(linux?.blurb, "Operating system on 2 hosts.");

    const gateway = chart.byId.get("host:10.10.10.1");
    assert.equal(gateway?.label, "gateway.lab");
    assert.equal(gateway?.blurb, "10.10.10.1 · 3 open");
    assert.ok(gateway?.facts.some((fact) => fact.k === "MAC" && fact.v === "00:11:22:33:44:55 (Lab)"));
    assert.ok(gateway?.facts.some((fact) => fact.k === "Latency" && fact.v === "0.0011s"));
    assert.equal(tiesOf(chart, "host:10.10.10.1").filter((tie) => tie.edge.label === "exposes").length, 3);

    const quiet = chart.byId.get("host:10.10.10.50");
    assert.equal(quiet?.blurb, "up, no open ports");
    assert.equal(quiet?.notes, "Nothing in this scan answered on an open port.");

    const hits = searchChart(chart, "10.10.10.1");
    assert.equal(hits?.nodes.has("host:10.10.10.1"), true);
  });

  it("reads nmap XML and skips down hosts and filtered ports", () => {
    const xml = `<?xml version="1.0"?>
<nmaprun scanner="nmap">
<host><status state="up"/>
<address addr="10.1.1.5" addrtype="ipv4"/>
<address addr="AA:BB:CC:DD:EE:FF" addrtype="mac" vendor="Lab"/>
<hostnames><hostname name="a.lab" type="PTR"/></hostnames>
<ports>
<port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="8.9p1" extrainfo="Ubuntu"/></port>
<port protocol="tcp" portid="23"><state state="filtered"/></port>
</ports>
<os><osmatch name="Linux 5.15" accuracy="100"><osclass type="general-purpose"/></osmatch></os>
<times srtt="2100" rttvar="0" to="100000"/>
</host>
<host><status state="down"/><address addr="10.1.1.9" addrtype="ipv4"/></host>
</nmaprun>`;
    const { chart } = parseScan(xml, "scan.xml");
    assert.equal(chart.nodes.filter((node) => node.kind === "host").length, 1);
    assert.equal(chart.nodes.some((node) => node.label === "23/tcp"), false);
    assert.ok(chart.nodes.some((node) => node.label === "OpenSSH 8.9p1"));
    assert.ok(chart.nodes.some((node) => node.label === "Linux 5.15"));
    assert.equal(chart.byId.get("host:10.1.1.5")?.facts.find((fact) => fact.k === "Latency")?.v, "2.1 ms");
    assert.equal(chart.nodes.find((node) => node.kind === "net")?.label, "10.1.1.0/24");
  });

  it("reads grepable output", () => {
    const gnmap = [
      "Host: 10.2.2.1 (a.lab)\tPorts: 22/open/tcp//ssh//OpenSSH 8.9p1/, 80/closed/tcp//http///\tOS: Linux 5.15",
      "Host: 10.2.2.2 (b.lab)\tPorts: 22/open/tcp//ssh//OpenSSH 8.9p1/\tStatus: Up",
    ].join("\n");
    const { chart } = parseScan(gnmap, "scan.gnmap");
    assert.equal(chart.nodes.filter((node) => node.kind === "host").length, 2);
    const shared = chart.nodes.find((node) => node.label === "OpenSSH 8.9p1");
    assert.ok(shared);
    assert.equal(chart.degree.get(shared.id), 2);
    assert.equal(chart.nodes.some((node) => node.label === "80/tcp"), false);
    assert.ok(chart.nodes.some((node) => node.label === "Linux 5.15"));
  });

  it("reads a headed CSV and ignores closed ports", () => {
    const csv = [
      "IP,Hostname,Port,Protocol,State,Service,Product,Version",
      "10.3.3.1,a.lab,22,tcp,open,ssh,OpenSSH,8.9p1",
      "10.3.3.2,b.lab,443,tcp,open,https,nginx,1.24.0",
      "10.3.3.9,down.lab,22,tcp,closed,ssh,OpenSSH,8.9p1",
    ].join("\n");
    const { chart } = parseScan(csv, "hosts.csv");
    assert.deepEqual(
      chart.nodes.filter((node) => node.kind === "host").map((node) => node.label).sort(),
      ["a.lab", "b.lab"],
    );
    assert.ok(chart.nodes.some((node) => node.label === "nginx 1.24.0"));
    assert.equal(chart.nodes.find((node) => node.kind === "net")?.label, "10.3.3.0/24");
  });

  it("reads a bare IP list and a second subnet", () => {
    const { chart } = parseScan("10.4.4.1\n10.4.4.2\n10.5.5.8\n", "addrs.txt");
    assert.equal(chart.nodes.filter((node) => node.kind === "host").length, 3);
    assert.equal(chart.nodes.filter((node) => node.kind === "net").length, 2);
    assert.equal(chart.nodes.some((node) => node.kind === "port"), false);
  });

  it("caps a large scan and says so", () => {
    const rows = ["ip,port,service"];
    for (let i = 0; i < 130; i += 1) rows.push(`10.8.${Math.floor(i / 50)}.${(i % 50) + 1},22,ssh`);
    const { chart, notice } = parseScan(rows.join("\n"), "big.csv");
    assert.equal(chart.nodes.filter((node) => node.kind === "host").length, 120);
    assert.equal(chart.nodes.some((node) => node.kind === "port"), false);
    assert.match(notice ?? "", /left out/);
    assert.match(notice ?? "", /Too many open ports/);
    assert.ok(chart.nodes.some((node) => node.label === "ssh"));
  });

  it("rejects empty and unrecognized files", () => {
    assert.throws(() => parseScan("   ", "x.nmap"), ScanParseError);
    assert.throws(() => parseScan("this is a letter, not a scan", "notes.txt"), ScanParseError);
  });
});
