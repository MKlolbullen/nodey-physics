import tempfile
import unittest
from pathlib import Path

from scanner.meridian import (
    Fetch,
    Probe,
    ScanError,
    Transport,
    file_kind,
    parse_banner,
    parse_dns_message,
    parse_target,
    run_scan,
)


class Scripted(Transport):
    def __init__(self) -> None:
        self.events: list[tuple[str, ...]] = []

    def addresses(self, host: str) -> list[str]:
        self.events.append(("resolve", host))
        return ["10.0.0.5"] if host == "lab" else []

    def probe(self, ip: str, port: int, host_header: str) -> Probe:
        self.events.append(("probe", ip, str(port)))
        if ip == "10.0.0.5" and port == 80:
            return Probe(True, "http", "nginx", "1.24.0", "nginx/1.24.0")
        return Probe(False)

    def records(self, name: str, rtype: str) -> list[str]:
        self.events.append(("dns", rtype, name))
        if rtype == "PTR":
            return ["www.lab"]
        if rtype == "A" and name in {"lab", "api.lab"}:
            return ["10.0.0.5"]
        if rtype == "TXT" and name == "lab":
            return ["v=spf1"]
        return []

    def fetch(self, url: str) -> Fetch:
        self.events.append(("fetch", url))
        if url.endswith("app.chunk.js"):
            return Fetch(200, "application/javascript", b"//# sourceMappingURL=app.js.map\n")
        if url.endswith(".map"):
            return Fetch(200, "application/json", b"{}")
        return Fetch(
            200,
            "text/html",
            b"<html><title>Lab</title><script src='/static/app.chunk.js'></script></html>",
        )


class ParseTargetTest(unittest.TestCase):
    def test_cidr_skips_network_and_broadcast(self) -> None:
        target = parse_target("10.0.0.0/30")
        self.assertEqual(target.kind, "cidr")
        self.assertEqual(target.hosts, ("10.0.0.1", "10.0.0.2"))

    def test_last_octet_range(self) -> None:
        target = parse_target("10.0.0.1-3")
        self.assertEqual(target.hosts, ("10.0.0.1", "10.0.0.2", "10.0.0.3"))

    def test_full_range_and_hostname(self) -> None:
        self.assertEqual(parse_target("10.0.0.8-10.0.0.9").hosts, ("10.0.0.8", "10.0.0.9"))
        named = parse_target("https://Files.LAB/app")
        self.assertEqual(named.kind, "name")
        self.assertEqual(named.name, "files.lab")

    def test_rejects_wide_ranges_and_metadata(self) -> None:
        with self.assertRaises(ScanError):
            parse_target("10.0.0.0/16")
        with self.assertRaises(ScanError):
            parse_target("169.254.169.254")


class BannerAndFilesTest(unittest.TestCase):
    def test_banner(self) -> None:
        service, product, version = parse_banner(
            80, b"HTTP/1.0 200 OK\r\nServer: nginx/1.24.0\r\n\r\n"
        )
        self.assertEqual((service, product, version), ("http", "nginx", "1.24.0"))
        self.assertEqual(parse_banner(22, b"SSH-2.0-OpenSSH_8.9p1\r\n")[1:], ("OpenSSH", "8.9p1"))

    def test_file_kinds_and_refs(self) -> None:
        self.assertEqual(file_kind("/static/app.chunk.js"), "chunk")
        self.assertEqual(file_kind("/app.js.map"), "map")
        self.assertEqual(file_kind("/a.ts"), "ts")
        refs = __import__("scanner.meridian", fromlist=["extract_refs"]).extract_refs(
            "<script src='/static/app.chunk.js'></script>\n//# sourceMappingURL=app.js.map",
            "http://lab/",
        )
        self.assertEqual(
            refs,
            ["http://lab/static/app.chunk.js", "http://lab/app.js.map"],
        )

    def test_dns_answer(self) -> None:
        packet = bytes.fromhex(
            "000181800001000100000000"
            "036c61620000010001"
            "c00c000100010000003c00040a000005"
        )
        self.assertEqual(parse_dns_message(packet), [("lab", "A", "10.0.0.5")])
        loop = bytes.fromhex("000181800001000100000000" "c00c00010001" "c00c000100010000003c00040a000005")
        self.assertEqual(parse_dns_message(loop), [])


class PipelineTest(unittest.TestCase):
    def test_steps_run_in_order_and_write_reports(self) -> None:
        scripted = Scripted()
        logs: list[str] = []
        with tempfile.TemporaryDirectory() as tmp:
            stem = str(Path(tmp) / "lab")
            report = run_scan("lab", transport=scripted, out_stem=stem, workers=4, log=logs.append)
            text = "\n".join(logs)
            self.assertLess(text.index("[1/4]"), text.index("[2/4]"))
            self.assertLess(text.index("[2/4]"), text.index("[3/4]"))
            self.assertLess(text.index("[3/4]"), text.index("[4/4]"))
            kinds = [item[0] for item in scripted.events]
            self.assertLess(kinds.index("probe"), kinds.index("dns"))
            self.assertLess(kinds.index("dns"), kinds.index("fetch"))
            fetches = [item[1] for item in scripted.events if item[0] == "fetch"]
            self.assertEqual(
                fetches,
                ["http://lab/", "http://lab/static/app.chunk.js", "http://lab/static/app.js.map"],
            )
            self.assertEqual([item.kind for item in report.files], ["chunk", "map"])
            self.assertEqual(report.hosts[0].ports[0].product, "nginx")
            self.assertTrue(any(rec.type == "A" and rec.name == "api.lab" for rec in report.dns))
            payload = Path(report.json_path).read_text(encoding="utf-8")
            self.assertIn('"meridian": 1', payload)
            csv_text = Path(report.csv_path).read_text(encoding="utf-8")
            self.assertTrue(csv_text.startswith("ip,hostname,port,protocol,state,service,product,version"))
            self.assertIn("10.0.0.5,lab,80,tcp,open,http,nginx,1.24.0", csv_text)


if __name__ == "__main__":
    unittest.main()
