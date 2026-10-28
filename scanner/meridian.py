#!/usr/bin/env python3
"""Scan one CIDR, IP range, or hostname and write a Meridian chart.

Steps run in order: host scan, DNS enumeration, crawl, then script and data files.
Only use it on hosts you are allowed to test. The file stays on this machine.
"""

from __future__ import annotations

import argparse
import csv
import ipaddress
import json
import random
import re
import socket
import ssl
import struct
import sys
import threading
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse

HOST_CAP = 512
MAX_PAGES = 20
MAX_DEPTH = 2
MAX_BODY = 500_000
FILE_CAP = 40
USER_AGENT = "MeridianScan/1.0"

SERVICE = {
    21: "ftp",
    22: "ssh",
    25: "smtp",
    53: "domain",
    80: "http",
    110: "pop3",
    143: "imap",
    443: "https",
    445: "smb",
    993: "imaps",
    995: "pop3s",
    1433: "mssql",
    3000: "http",
    3306: "mysql",
    3389: "rdp",
    5000: "http",
    5432: "postgresql",
    5900: "vnc",
    6379: "redis",
    8000: "http",
    8080: "http",
    8081: "http",
    8443: "https",
    8888: "http",
    9200: "http",
    9443: "https",
}
PROBE_PORTS = tuple(sorted(SERVICE))
SECURE_PORTS = {443, 8443, 9443}
WEB_PORTS = {port for port, name in SERVICE.items() if name in {"http", "https"}}
LABELS = (
    "www", "mail", "api", "dev", "staging", "vpn", "ns1", "admin",
    "files", "gateway", "app", "cdn", "static", "assets", "portal",
    "git", "jenkins", "grafana", "db", "blog", "beta", "test",
    "auth", "login", "sso", "webmail", "status", "ci", "preview",
    "uat", "demo", "internal", "edge", "proxy", "origin", "m",
)
QTYPE = {"A": 1, "NS": 2, "CNAME": 5, "PTR": 12, "MX": 15, "TXT": 16, "AAAA": 28}
QNAME = {value: key for key, value in QTYPE.items()}
BLOCKED = (
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("ff00::/8"),
)
REF_RE = re.compile(
    r"""(?i)(?:https?://|//|/|\./|\.\./)[^\s"'<>()\\]{1,240}?\.(?:chunk\.js|js|json|map|chunk|ts)(?=$|[\s"'<>()\\?#])"""
)
MAP_RE = re.compile(r"(?i)sourceMappingURL=(\S+)")
HOST_RE = re.compile(
    r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$",
    re.IGNORECASE,
)


class ScanError(Exception):
    pass


@dataclass
class Target:
    raw: str
    kind: str
    hosts: tuple[str, ...]
    name: str
    notices: tuple[str, ...] = ()


@dataclass
class Probe:
    open: bool
    service: str = ""
    product: str = ""
    version: str = ""
    banner: str = ""


@dataclass
class Fetch:
    status: int
    content_type: str
    body: bytes


@dataclass
class PortRec:
    port: int
    proto: str
    state: str
    service: str
    product: str
    version: str


@dataclass
class HostRec:
    ip: str
    names: list[str] = field(default_factory=list)
    ports: list[PortRec] = field(default_factory=list)
    up: bool = True


@dataclass
class DnsRec:
    name: str
    type: str
    value: str


@dataclass
class PageRec:
    url: str
    status: int
    ip: str
    title: str


@dataclass
class FileRec:
    url: str
    kind: str
    status: int
    ip: str


@dataclass
class Report:
    target: str
    hosts: list[HostRec]
    dns: list[DnsRec]
    pages: list[PageRec]
    files: list[FileRec]
    notices: list[str]
    json_path: str = ""
    csv_path: str = ""

    def to_dict(self) -> dict[str, object]:
        return {
            "meridian": 1,
            "target": self.target,
            "notices": self.notices,
            "hosts": [
                {
                    "ip": host.ip,
                    "names": host.names,
                    "up": host.up,
                    "ports": [port.__dict__ for port in host.ports],
                }
                for host in self.hosts
            ],
            "dns": [rec.__dict__ for rec in self.dns],
            "pages": [rec.__dict__ for rec in self.pages],
            "files": [rec.__dict__ for rec in self.files],
        }


class Transport:
    """Network calls. Tests pass a substitute."""

    def addresses(self, host: str) -> list[str]:
        raise NotImplementedError

    def probe(self, ip: str, port: int, host_header: str) -> Probe:
        raise NotImplementedError

    def records(self, name: str, rtype: str) -> list[str]:
        raise NotImplementedError

    def fetch(self, url: str) -> Fetch:
        raise NotImplementedError


def allowed(ip: str) -> bool:
    try:
        address = ipaddress.ip_address(ip.split("%", 1)[0])
    except ValueError:
        return False
    return not any(address in net for net in BLOCKED)


def file_kind(path: str) -> str:
    base = path.split("?", 1)[0].split("#", 1)[0].lower()
    name = base.rsplit("/", 1)[-1]
    if name.endswith(".chunk") or ".chunk." in name:
        return "chunk"
    for ext in ("map", "json", "js", "ts"):
        if name.endswith("." + ext):
            return ext
    return ""


def parse_target(raw: str) -> Target:
    text = raw.strip()
    if "://" in text:
        parsed = urlparse(text)
        if not parsed.hostname:
            raise ScanError("That URL has no host.")
        text = parsed.hostname
    text = text.strip().strip(".").lower()
    if not text:
        raise ScanError("Enter a CIDR, an IP range, or a hostname.")

    if "/" in text:
        try:
            net = ipaddress.ip_network(text, strict=False)
        except ValueError as err:
            raise ScanError(f"{raw.strip()} is not a CIDR.") from err
        if net.num_addresses > HOST_CAP + 2:
            raise ScanError(f"That range has {net.num_addresses} addresses. The cap is {HOST_CAP}. Split it.")
        if isinstance(net, ipaddress.IPv4Network) and net.prefixlen < 31:
            expanded = [str(ip) for ip in net.hosts()]
        else:
            expanded = [str(ip) for ip in net]
        return _finish_addresses(raw.strip(), "cidr", expanded)

    if "-" in text and re.match(r"\d", text):
        left, right = [part.strip() for part in text.split("-", 1)]
        try:
            start = ipaddress.ip_address(left)
        except ValueError as err:
            raise ScanError(f"{raw.strip()} is not an IP range.") from err
        if re.fullmatch(r"\d{1,3}", right) and isinstance(start, ipaddress.IPv4Address):
            prefix = left.rsplit(".", 1)[0]
            try:
                end = ipaddress.ip_address(f"{prefix}.{int(right)}")
            except ValueError as err:
                raise ScanError(f"{raw.strip()} is not an IP range.") from err
        else:
            try:
                end = ipaddress.ip_address(right)
            except ValueError as err:
                raise ScanError(f"{raw.strip()} is not an IP range.") from err
        if end.version != start.version or int(end) < int(start):
            raise ScanError(f"{raw.strip()} is not an IP range.")
        count = int(end) - int(start) + 1
        if count > HOST_CAP:
            raise ScanError(f"That range has {count} addresses. The cap is {HOST_CAP}. Split it.")
        expanded = [str(ipaddress.ip_address(start + offset)) for offset in range(count)]
        return _finish_addresses(raw.strip(), "range", expanded)

    if _is_ip(text):
        return _finish_addresses(raw.strip(), "host", [text])

    if not HOST_RE.match(text):
        raise ScanError(f"{raw.strip()} is not a CIDR, an IP range, or a hostname.")
    return Target(raw.strip(), "name", (), text)


def _finish_addresses(raw: str, kind: str, expanded: list[str]) -> Target:
    kept = [ip for ip in expanded if allowed(ip)]
    dropped = len(expanded) - len(kept)
    if not kept:
        raise ScanError("Nothing in that target is scanned. Link-local and metadata addresses are skipped.")
    notices = ()
    if dropped:
        notices = (f"Skipped {dropped} link-local or reserved addresses.",)
    if len(kept) > HOST_CAP:
        raise ScanError(f"That range has {len(kept)} addresses. The cap is {HOST_CAP}. Split it.")
    return Target(raw, kind, tuple(kept), "", notices)


def _is_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value.split("%", 1)[0])
    except ValueError:
        return False
    return True


def split_server(value: str) -> tuple[str, str]:
    head = value.split(",")[0].strip()
    if not head:
        return "", ""
    match = re.match(r"([A-Za-z][\w.+-]*)(?:/(\S+))?", head)
    if not match:
        return head[:40], ""
    return match.group(1), (match.group(2) or "").rstrip(";")


def parse_banner(port: int, data: bytes) -> tuple[str, str, str]:
    text = data.decode("latin-1", "replace")
    service = SERVICE.get(port, "tcp")
    if text.startswith("SSH-"):
        match = re.search(r"OpenSSH[_-]([0-9]\S*)", text)
        if match:
            return "ssh", "OpenSSH", match.group(1).rstrip(".")
        return "ssh", "", ""
    server = ""
    if text.upper().startswith("HTTP/"):
        service = "https" if port in SECURE_PORTS else "http"
        for line in text.splitlines():
            if line.lower().startswith("server:"):
                server = line.split(":", 1)[1].strip()
                break
    product, version = split_server(server)
    return service, product, version


def slug(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-")
    return (cleaned or "scan")[:48]


class _Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []
        self._title: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() in {"a", "link", "script", "iframe", "source", "img"}:
            for key in ("href", "src"):
                if attr.get(key):
                    self.hrefs.append(attr[key])
        if tag.lower() == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title.append(data)

    @property
    def title(self) -> str:
        return re.sub(r"\s+", " ", "".join(self._title)).strip()[:80]


def resolve_ref(base: str, raw: str) -> str:
    text = raw.strip().strip("\"'`")
    if not text or text.startswith(("data:", "mailto:", "javascript:", "#")):
        return ""
    absolute, _frag = urldefrag(urljoin(base, text))
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return absolute


def extract_links(body: str, base: str) -> tuple[list[str], str]:
    parser = _Links()
    try:
        parser.feed(body)
    except Exception:
        return [], ""
    found: list[str] = []
    seen: set[str] = set()
    for href in parser.hrefs:
        url = resolve_ref(base, href)
        if not url or url in seen:
            continue
        seen.add(url)
        found.append(url)
    return found, parser.title


def extract_refs(body: str, base: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()

    def add(raw: str) -> None:
        url = resolve_ref(base, raw)
        if not url or url in seen or not file_kind(urlparse(url).path):
            return
        seen.add(url)
        found.append(url)

    for url in extract_links(body, base)[0]:
        add(url)
    for match in REF_RE.finditer(body):
        add(match.group(0))
    for match in MAP_RE.finditer(body):
        add(match.group(1).strip())
    return found


def origin_key(url: str) -> str:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80
    if ":" in host:
        host = f"[{host}]"
    return f"{parsed.scheme}://{host}:{port}"


def same_origin(url: str, seed: str) -> bool:
    return origin_key(url) == origin_key(seed)


def encode_dns_name(name: str) -> bytes:
    labels = name.strip(".").split(".") if name.strip(".") else []
    out = b""
    for label in labels:
        raw = label.encode("idna")
        if not raw or len(raw) > 63:
            raise ScanError(f"Bad DNS name {name}")
        out += bytes([len(raw)]) + raw
    return out + b"\x00"


def build_dns_query(name: str, rtype: str, ident: int | None = None) -> bytes:
    qtype = QTYPE[rtype]
    header = struct.pack("!HHHHHH", ident if ident is not None else random.randint(0, 65535), 0x0100, 1, 0, 0, 0)
    return header + encode_dns_name(name) + struct.pack("!HH", qtype, 1)


def _read_dns_name(packet: bytes, offset: int, depth: int = 0) -> tuple[str, int]:
    if depth > 8 or offset >= len(packet):
        raise ValueError("dns name")
    labels: list[bytes] = []
    jumped = False
    end = offset
    while True:
        if offset >= len(packet):
            raise ValueError("dns name")
        length = packet[offset]
        if length == 0:
            offset += 1
            if not jumped:
                end = offset
            break
        if length & 0xC0 == 0xC0:
            if offset + 1 >= len(packet):
                raise ValueError("dns pointer")
            pointer = ((length & 0x3F) << 8) | packet[offset + 1]
            if pointer >= len(packet):
                raise ValueError("dns pointer")
            if not jumped:
                end = offset + 2
            jumped = True
            offset = pointer
            depth += 1
            if depth > 8:
                raise ValueError("dns name")
            continue
        if offset + 1 + length > len(packet):
            raise ValueError("dns label")
        labels.append(packet[offset + 1 : offset + 1 + length])
        offset += 1 + length
        if not jumped:
            end = offset
    return b".".join(labels).decode("ascii", "replace"), end


def parse_dns_message(packet: bytes) -> list[tuple[str, str, str]]:
    if len(packet) < 12:
        return []
    _ident, _flags, qd, an, _ns, _ar = struct.unpack("!HHHHHH", packet[:12])
    offset = 12
    try:
        for _ in range(qd):
            _name, offset = _read_dns_name(packet, offset)
            offset += 4
        found: list[tuple[str, str, str]] = []
        for _ in range(an):
            name, offset = _read_dns_name(packet, offset)
            if offset + 10 > len(packet):
                break
            rtype, _class, _ttl, rdlen = struct.unpack("!HHIH", packet[offset : offset + 10])
            offset += 10
            if offset + rdlen > len(packet):
                break
            data = packet[offset : offset + rdlen]
            offset += rdlen
            kind = QNAME.get(rtype, "")
            value = _rdata(kind, data, packet, offset - rdlen)
            if kind and value:
                found.append((name, kind, value))
        return found
    except (ValueError, struct.error):
        return []


def _rdata(kind: str, data: bytes, packet: bytes, offset: int) -> str:
    if kind == "A" and len(data) == 4:
        return socket.inet_ntoa(data)
    if kind == "AAAA" and len(data) == 16:
        return socket.inet_ntop(socket.AF_INET6, data)
    if kind in {"CNAME", "NS", "PTR"}:
        try:
            name, _end = _read_dns_name(packet, offset)
        except ValueError:
            return ""
        return name
    if kind == "MX" and len(data) >= 3:
        try:
            name, _end = _read_dns_name(packet, offset + 2)
        except ValueError:
            return ""
        return name
    if kind == "TXT":
        parts: list[str] = []
        cursor = 0
        while cursor < len(data):
            size = data[cursor]
            cursor += 1
            parts.append(data[cursor : cursor + size].decode("utf-8", "replace"))
            cursor += size
        return "".join(parts)[:200]
    return ""


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        return None


class DefaultTransport(Transport):
    def __init__(self, timeout: float) -> None:
        self.timeout = timeout
        self._ssl = ssl._create_unverified_context()
        self._opener = urllib.request.build_opener(_NoRedirect)
        self._resolver = _resolver()
        self._dns_failed = False

    def addresses(self, host: str) -> list[str]:
        if _is_ip(host):
            return [host] if allowed(host) else []
        found: list[str] = []
        try:
            socket.setdefaulttimeout(self.timeout)
            infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        except socket.gaierror:
            return []
        for info in infos:
            ip = info[4][0].split("%", 1)[0]
            if ip not in found and allowed(ip):
                found.append(ip)
        return found

    def probe(self, ip: str, port: int, host_header: str) -> Probe:
        if not allowed(ip):
            return Probe(False)
        sock = socket.socket(socket.AF_INET6 if ":" in ip else socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        try:
            sock.connect((ip, port))
            if port in SECURE_PORTS:
                sock = self._ssl.wrap_socket(sock, server_hostname=host_header or None)
            if port in WEB_PORTS:
                host = host_header or ip
                sock.sendall(
                    f"HEAD / HTTP/1.0\r\nHost: {host}\r\nUser-Agent: {USER_AGENT}\r\nConnection: close\r\n\r\n".encode()
                )
            data = b""
            try:
                while len(data) < 2048:
                    chunk = sock.recv(2048 - len(data))
                    if not chunk:
                        break
                    data += chunk
            except socket.timeout:
                pass
        except (OSError, ssl.SSLError):
            return Probe(False)
        finally:
            try:
                sock.close()
            except OSError:
                pass
        service, product, version = parse_banner(port, data)
        banner = ""
        if product:
            banner = product if not version else f"{product}/{version}"
        return Probe(True, service, product, version, banner)

    def records(self, name: str, rtype: str, follow: bool = True) -> list[str]:
        packet = build_dns_query(name, rtype)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(min(2.0, max(0.6, self.timeout)))
            sock.sendto(packet, (self._resolver, 53))
            data, _addr = sock.recvfrom(4096)
            sock.close()
        except OSError:
            self._dns_failed = True
            return []
        answers = parse_dns_message(data)
        wanted = [value for _name, kind, value in answers if kind == rtype and value]
        if wanted or not follow or rtype not in {"A", "AAAA"}:
            return wanted
        cnames = [value for _name, kind, value in answers if kind == "CNAME" and value]
        if not cnames or cnames[0].lower().rstrip(".") == name.lower().rstrip("."):
            return []
        return self.records(cnames[0], rtype, follow=False)

    def fetch(self, url: str) -> Fetch:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if not host or not self.addresses(host):
            raise ScanError(f"Skipped {url}")
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
        try:
            with self._opener.open(request, timeout=max(self.timeout, 3)) as response:
                body = response.read(MAX_BODY)
                status = getattr(response, "status", 200)
                ctype = response.headers.get("Content-Type", "")
                return Fetch(status, ctype, body)
        except urllib.error.HTTPError as err:
            body = err.read(MAX_BODY) if err.fp else b""
            ctype = err.headers.get("Content-Type", "") if err.headers else ""
            return Fetch(err.code, ctype, body)


def _resolver() -> str:
    try:
        text = Path("/etc/resolv.conf").read_text(encoding="utf-8", errors="replace")
    except OSError:
        return "1.1.1.1"
    for line in text.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0] == "nameserver" and _is_ip(parts[1]):
            return parts[1]
    return "1.1.1.1"


def _emit(log, line: str) -> None:
    log(line)


def host_scan(target: Target, transport: Transport, log, workers: int) -> list[HostRec]:
    ips = list(target.hosts)
    if target.name and not ips:
        ips = [ip for ip in transport.addresses(target.name) if allowed(ip)]
        if ips:
            _emit(log, f"  {target.name}  {', '.join(ips)}")
        else:
            _emit(log, f"  {target.name}  did not resolve")
    if not ips:
        return []
    _emit(log, f"  {len(ips)} addresses, {len(PROBE_PORTS)} ports")
    header = target.name or ""
    found: dict[str, HostRec] = {}
    lock = threading.Lock()

    def one(ip: str, port: int) -> None:
        probe = transport.probe(ip, port, header or ip)
        if not probe.open:
            return
        with lock:
            host = found.get(ip)
            if host is None:
                host = HostRec(ip, [header] if header else [], [], True)
                found[ip] = host
            host.ports.append(
                PortRec(port, "tcp", "open", probe.service, probe.product, probe.version)
            )

    jobs = [(ip, port) for ip in ips for port in PROBE_PORTS]
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = [pool.submit(one, ip, port) for ip, port in jobs]
        for future in as_completed(futures):
            future.result()
    hosts = [found[ip] for ip in ips if ip in found]
    for host in hosts:
        host.ports.sort(key=lambda item: item.port)
        bits = [f"{port.port}/tcp {port.service}" for port in host.ports]
        banners = [f"{port.product}/{port.version}".rstrip("/") for port in host.ports if port.product]
        if banners:
            bits.append(", ".join(dict.fromkeys(banners)))
        _emit(log, f"  up  {host.ip}  " + "  ".join(bits))
    quiet = len(ips) - len(hosts)
    _emit(log, f"  {len(hosts)} up, {quiet} silent")
    if target.name and not hosts:
        for ip in ips:
            hosts.append(HostRec(ip, [target.name], [], False))
    return hosts


def dns_scan(target: Target, hosts: list[HostRec], transport: Transport, log) -> tuple[list[DnsRec], list[str]]:
    dns: list[DnsRec] = []
    notices: list[str] = []
    cache: dict[tuple[str, str], list[str]] = {}

    def ask(name: str, rtype: str, display: str | None = None) -> list[str]:
        key = (name.lower().rstrip("."), rtype)
        if key not in cache:
            try:
                cache[key] = transport.records(name, rtype)
            except Exception:
                cache[key] = []
            shown = display or name
            for value in cache[key]:
                dns.append(DnsRec(shown, rtype, value))
                _emit(log, f"  {rtype:<5} {shown}  {value}")
        return cache[key]

    live = [host for host in hosts if host.up]
    for host in live:
        try:
            pointer = ipaddress.ip_address(host.ip).reverse_pointer
        except ValueError:
            continue
        for value in ask(pointer, "PTR", host.ip):
            if not value or not HOST_RE.match(value):
                continue
            confirmed = host.ip in ask(value, "A") or host.ip in ask(value, "AAAA")
            own = bool(target.name) and (value == target.name or value.endswith("." + target.name))
            if confirmed and (own or not target.name) and value not in host.names:
                host.names.append(value)

    apex = target.name
    if apex:
        for rtype in ("A", "AAAA", "CNAME", "MX", "NS", "TXT"):
            ask(apex, rtype)
        apex_addrs = set(cache.get((apex, "A"), [])) | set(cache.get((apex, "AAAA"), []))
        same = 0
        for label in LABELS:
            name = f"{label}.{apex}"
            addrs = set(ask(name, "A")) | set(ask(name, "AAAA"))
            if apex_addrs and addrs and addrs <= apex_addrs:
                same += 1
                if same >= 8:
                    notices.append("Wildcard DNS. Subdomain enumeration stopped.")
                    _emit(log, "  wildcard DNS, stopped")
                    break
            elif addrs:
                same = 0
    if not dns:
        _emit(log, "  no records")
    else:
        _emit(log, f"  {len(dns)} records")
    return dns, notices


def _seeds(host: HostRec) -> list[tuple[str, str]]:
    if not host.up:
        return []
    name = next((item for item in host.names if item and not _is_ip(item)), "")
    label = name or host.ip
    seeds: list[tuple[str, str]] = []
    for port in host.ports:
        if port.port not in WEB_PORTS and port.service not in {"http", "https"}:
            continue
        scheme = "https" if port.port in SECURE_PORTS or port.service == "https" else "http"
        hostpart = f"[{label}]" if ":" in label and not label.startswith("[") else label
        default = 443 if scheme == "https" else 80
        origin = hostpart if port.port == default else f"{hostpart}:{port.port}"
        seeds.append((f"{scheme}://{origin}/", host.ip))
    return seeds


def crawl(hosts: list[HostRec], transport: Transport, log) -> list[tuple[PageRec, str]]:
    pages: list[tuple[PageRec, str]] = []
    seen: set[str] = set()
    for host in hosts:
        for seed, ip in _seeds(host):
            queue: list[tuple[str, int]] = [(seed, 0)]
            seen.add(origin_key(seed) + seed)
            taken = 0
            while queue and taken < MAX_PAGES and len(pages) < MAX_PAGES * 4:
                url, depth = queue.pop(0)
                try:
                    fetched = transport.fetch(url)
                except Exception:
                    _emit(log, f"  skip  {url}")
                    continue
                body = fetched.body.decode("utf-8", "replace")
                links, title = extract_links(body, url)
                ctype = fetched.content_type.lower()
                html = "html" in ctype or body.lstrip()[:1] == "<"
                rec = PageRec(url, fetched.status, ip, title if html else "")
                pages.append((rec, body if html or file_kind(urlparse(url).path) else ""))
                taken += 1
                label = f"  {fetched.status}  {url}"
                if title and html:
                    label += f"  {title}"
                _emit(log, label)
                if not html or depth >= MAX_DEPTH:
                    continue
                for link in links:
                    if not same_origin(link, seed) or file_kind(urlparse(link).path):
                        continue
                    key = origin_key(link) + link
                    if key in seen:
                        continue
                    seen.add(key)
                    queue.append((link, depth + 1))
    if not pages:
        _emit(log, "  no web ports")
    else:
        _emit(log, f"  {len(pages)} pages")
    return pages


def hunt(pages: list[tuple[PageRec, str]], transport: Transport, log) -> list[FileRec]:
    found: list[FileRec] = []
    seen = {rec.url for rec, _body in pages}
    queue: list[tuple[str, str]] = []
    queued: set[str] = set()

    def push(url: str, ip: str) -> None:
        if url in queued or not file_kind(urlparse(url).path):
            return
        if not any(same_origin(url, rec.url) for rec, _body in pages):
            return
        queued.add(url)
        queue.append((url, ip))

    for rec, body in pages:
        kind = file_kind(urlparse(rec.url).path)
        if kind:
            found.append(FileRec(rec.url, kind, rec.status, rec.ip))
            _emit(log, f"  {rec.status}  {kind}  {rec.url}")
        for url in extract_refs(body, rec.url):
            push(url, rec.ip)

    waves = 0
    while queue and waves < 2 and len(found) < FILE_CAP:
        waves += 1
        batch = queue
        queue = []
        for url, ip in batch:
            if len(found) >= FILE_CAP:
                break
            if url in seen:
                continue
            seen.add(url)
            try:
                fetched = transport.fetch(url)
            except Exception:
                _emit(log, f"  skip  {url}")
                continue
            kind = file_kind(urlparse(url).path)
            if not kind:
                continue
            found.append(FileRec(url, kind, fetched.status, ip))
            _emit(log, f"  {fetched.status}  {kind}  {url}")
            body = fetched.body.decode("utf-8", "replace")
            for ref in extract_refs(body, url):
                push(ref, ip)
    if len(queue) and len(found) >= FILE_CAP:
        _emit(log, f"  stopped at {FILE_CAP} files")
    if not found:
        _emit(log, "  none")
    else:
        _emit(log, f"  {len(found)} files")
    return found


def write_report(report: Report, stem: str) -> None:
    path = Path(stem)
    if path.parent and str(path.parent) not in {"", "."}:
        path.parent.mkdir(parents=True, exist_ok=True)
    json_path = Path(str(path) + ".json")
    csv_path = Path(str(path) + ".csv")
    json_path.write_text(json.dumps(report.to_dict(), indent=2) + "\n", encoding="utf-8")
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["ip", "hostname", "port", "protocol", "state", "service", "product", "version"])
        for host in report.hosts:
            name = host.names[0] if host.names else ""
            if not host.ports:
                if host.up:
                    writer.writerow([host.ip, name, "", "", "", "", "", ""])
                continue
            for port in host.ports:
                writer.writerow(
                    [host.ip, name, port.port, port.proto, port.state, port.service, port.product, port.version]
                )
    report.json_path = str(json_path)
    report.csv_path = str(csv_path)


def run_scan(
    raw: str,
    *,
    transport: Transport | None = None,
    out_stem: str | None = None,
    workers: int = 48,
    log=print,
) -> Report:
    target = parse_target(raw)
    if transport is None:
        timeout = 0.8 if len(target.hosts) <= 4 else 0.35
        transport = DefaultTransport(timeout)
    notices = list(target.notices)
    for note in notices:
        _emit(log, f"  {note}")
    _emit(log, f"[1/4] Host scan  {target.raw}")
    hosts = host_scan(target, transport, log, workers)
    _emit(log, "[2/4] DNS enumeration")
    dns, dns_notes = dns_scan(target, hosts, transport, log)
    notices.extend(dns_notes)
    _emit(log, "[3/4] Crawling")
    pages = crawl(hosts, transport, log)
    _emit(log, "[4/4] Script and data files")
    files = hunt(pages, transport, log)
    report = Report(
        target.raw,
        [host for host in hosts if host.up or host.ports],
        dns,
        [rec for rec, _body in pages],
        files,
        notices,
    )
    stem = out_stem or str(Path.cwd() / f"meridian-{slug(target.raw)}")
    write_report(report, stem)
    _emit(log, f"wrote {report.json_path}")
    _emit(log, f"wrote {report.csv_path}")
    return report


def _prompt() -> str:
    try:
        return input("target (CIDR, range, or hostname): ").strip()
    except EOFError:
        return ""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="meridian",
        description="Scan one CIDR, IP range, or hostname. Hosts, then DNS, then a crawl, then .js .json .map .chunk .ts files.",
    )
    parser.add_argument("target", nargs="?", help="10.0.0.0/24, 10.0.0.1-10.0.0.40, 10.0.0.1-40, or a hostname")
    parser.add_argument("--out", help="Path prefix for the .json and .csv. Default meridian-<target> in the current directory.")
    parser.add_argument("--workers", type=int, default=48)
    args = parser.parse_args(argv)
    print("Meridian scan. Only use this on hosts you are allowed to test.", flush=True)
    once = bool(args.target) or not sys.stdin.isatty()

    def take() -> str:
        if args.target:
            return args.target.strip()
        if not sys.stdin.isatty():
            return sys.stdin.readline().strip()
        return _prompt()

    while True:
        target = take()
        if not target:
            return 0 if not once else 2
        try:
            run_scan(target, out_stem=args.out, workers=max(1, args.workers))
        except ScanError as err:
            print(str(err), file=sys.stderr, flush=True)
            if once:
                return 1
            continue
        if once:
            return 0
        args.target = None


if __name__ == "__main__":
    raise SystemExit(main())
