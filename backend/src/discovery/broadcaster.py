#!/usr/bin/env python3
"""
Simple UDP broadcaster for service discovery.

Sends a periodic discovery request broadcast on the local network and
prints any listener responses. Includes a small JSON payload so listeners
can advertise service info (hostname, service_port, name).

Usage:
  python broadcaster.py --port 6000 --interval 1

"""
import argparse
import json
import socket
import time
import uuid
import platform


def make_socket():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    # allow reuse on some platforms
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    except Exception:
        pass
    s.bind(("", 0))
    return s


def run_broadcaster(discovery_port: int, interval: float, service_port: int, name: str):
    sock = make_socket()
    id = str(uuid.uuid4())[:8]
    payload = {
        "type": "DISCOVER_REQUEST",
        "id": id,
        "name": name,
        "service_port": service_port,
        "hostname": platform.node(),
    }

    print(f"Broadcasting discovery to port {discovery_port} every {interval}s (id={id})")

    try:
        while True:
            msg = json.dumps(payload).encode('utf-8')
            # Broadcast to local network
            sock.sendto(msg, ("255.255.255.255", discovery_port))
            # Also try limited local broadcast
            try:
                sock.sendto(msg, ("<broadcast>", discovery_port))
            except Exception:
                pass

            # Listen for replies for a short window
            sock.settimeout(0.5)
            start = time.time()
            while time.time() - start < 0.5:
                try:
                    data, addr = sock.recvfrom(2048)
                    try:
                        resp = json.loads(data.decode('utf-8'))
                    except Exception:
                        resp = {"raw": data.decode('utf-8', errors='ignore')}
                    print(f"Found listener at {addr[0]}:{addr[1]} -> {resp}")
                except socket.timeout:
                    break
                except Exception as e:
                    print('Receive error:', e)
                    break

            time.sleep(interval)

    except KeyboardInterrupt:
        print('\nStopping broadcaster')
    finally:
        sock.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', '--discovery-port', dest='port', type=int, default=6000,
                        help='Discovery UDP port')
    parser.add_argument('--interval', type=float, default=1.0, help='Broadcast interval seconds')
    parser.add_argument('--service-port', type=int, default=5000, help='Service port to advertise')
    parser.add_argument('--name', type=str, default='sureroute-backend', help='Service name')
    args = parser.parse_args()

    run_broadcaster(args.port, args.interval, args.service_port, args.name)


if __name__ == '__main__':
    main()
