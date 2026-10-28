# Meridian

A force-directed chart of a network. Hosts, addresses, open ports, services, versions, and operating systems are nodes. A tie is a relationship, not a row in a spreadsheet: a prefix holds its hosts, a host exposes ports, and every port that runs the same build meets on one software node.

The file never leaves the tab. Import reads it locally.

![Lab scan drawn as a relationship chart. One /24 holds five hosts. Open ports hang off each host and meet at shared software such as nginx 1.24.0 and OpenSSH 8.9p1. Linux 5.15 is one operating-system node for two hosts.](docs/images/lab-scan.png)

The lab scan above is one `/24`, five hosts, and the open ports from a normal Nmap report. `10.10.10.0/24` holds every host. `gateway.lab`, `files.lab`, and `jump.lab` all run `nginx 1.24.0`, so that version is a single node with three `runs` ties. `OpenSSH 8.9p1` and `OpenSSH 9.6p1` stay apart. `Linux 5.15` is shared by the two hosts whose OS match said so. `10.10.10.50` is up and has nothing open, so its only tie is the prefix.

Searching `nginx` keeps that hub and fades everything else.

![Search for nginx. The shared nginx 1.24.0 node and the three ports that run it stay lit. The rest of the scan is dimmed.](docs/images/shared-software.png)

The same chart on a phone. Drag a node, drag empty space to pan, pinch to zoom.

![The lab scan on a narrow screen. The file name, counts, and kind filters sit above the chart.](docs/images/lab-scan-phone.png)

## Ties

| From | Verb | To | Meaning |
|---|---|---|---|
| Network | holds | Host | Same IPv4 `/24`, or the same IPv6 prefix |
| Host | exposes | Port | An open port, labeled `22/tcp` |
| Port | runs | Software | Product and version, or the service name when the banner is thin |
| Host | runs | Software | Operating system, kept separate from the service of the same name |

Closed and filtered ports are not drawn. A down host with no open port is left out. Two banners that differ only by a package suffix (`OpenSSH 8.9p1 Ubuntu 4ubuntu0.1` and `…4ubuntu0.5`) collapse to `OpenSSH 8.9p1`.

On a large file the chart keeps the 120 hosts with the most open ports. Past 100 open ports, the ports stay on the host card and the software nodes remain, so the shared builds are still visible.

## What each kind carries

| Kind | Drawn as | Facts |
|---|---|---|
| Network | Hexagon | Prefix, host count |
| Host | Disc | Address, latency, MAC and vendor, OS, hop count, open-port count |
| Port | Ring | State, service name, banner |
| Software | Triangle | `OS` or `Software`, and how many hosts share it |

A host is labeled with its name when the scan has one, and the address is a fact, so searching the IP still finds it. The legend filters are **Networks**, **Hosts**, **Ports**, and **Software**.

## What import reads today

| File | Typical source |
|---|---|
| Nmap XML | `nmap -oX` |
| Nmap normal | `nmap -oN`, usually `.nmap` |
| Nmap grepable | `nmap -oG`, usually `.gnmap` |
| Masscan XML | Same host / address / port shape as Nmap XML |
| CSV | A header with `ip` or `address`, plus `port`, `protocol`, `state`, `service`, `product`, `version`, `os`, `hostname`, `mac` when you have them. Semicolons and tabs are fine |
| IP list | One address per line |

**Import** or drop the file on the chart. **Sample** loads the lab scan in the pictures. **Story** returns to the original chart. Nothing is uploaded.

## Tools that complement the same graph

ProjectDiscovery output and the passive APIs do not need a second drawing. They add facts and ties onto the nodes a scan already has. A new CVE is not a new kind of picture. It is another shared node, the way two hosts already share one nginx.

| Source | What it adds | Where it lands |
|---|---|---|
| [dnsx](https://github.com/projectdiscovery/dnsx) | A, AAAA, CNAME, NS, PTR | Address and name on the host. A CNAME is a tie to another name. A new A record can move a host onto a prefix |
| [httpx](https://github.com/projectdiscovery/httpx) | Status, title, webserver, tech, TLS, CDN, hashes | Tech and `webserver` become software the port runs (`nginx 1.24.0`, `PHP 8.3`). Title and status are host or port facts |
| [tlsx](https://github.com/projectdiscovery/tlsx) | Version, cipher, SAN, issuer, expiry, JARM | The certificate subject is a fact on `443/tcp`. A shared JARM or issuer is a software-style hub: many hosts, one node |
| [katana](https://github.com/projectdiscovery/katana) | Crawled URLs, parameters, JS files | Endpoints hang off the host that served them. A repeated path across hosts is one node they all expose |
| [cariddi](https://github.com/edoardottt/cariddi) | Endpoints, secrets, leaked files | A secret or file is a node the host holds. The same leak on two hosts is one node, not two rows |
| [Shodan](https://www.shodan.io/) | Banners, CPE, tags, vulns, org, ASN | Banner and CPE refine the software node. A CVE Shodan already attached to the banner is a vulnerability node that software has |
| [Censys](https://search.censys.io/) | Services, software, certificates, location | Same as a banner: service plus version runs on that port. A certificate seen on many hosts is one node |
| [VirusTotal](https://www.virustotal.com/) | Resolutions, communicating files, detections | A resolution is another address the name holds. A malicious file tied to several hosts is one node they share |
| [FOFA](https://fofa.info/) | Query hits: ip, port, protocol, product, version | One hit is a host, a port, and a software node. The product string is the hub |

Vulnerability data follows the software, not a private list per host. `CVE-2024-xxxx` on `nginx 1.24.0` is one node. Every port that runs that build has it, which is the relationship the chart is for. Nuclei findings work the same way when the template names a product or CVE: the finding is shared, the affected port is the tie.

These sources are complements. The chart does not call Shodan, Censys, VirusTotal, or FOFA. Export or join their records into Nmap output or the CSV columns above and import that file. The hubs come out the same.

```text
prefix  --holds-->   host  --exposes-->  port  --runs-->  software
                      |                                    |
                      +--runs--> os                         +--has--> vulnerability
```
