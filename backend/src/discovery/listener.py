#!/usr/bin/env python3
"""
UDP listener for discovery requests.

Listens on DISCOVERY_PORT for JSON discovery requests and replies with a
small JSON advert containing hostname, service port, and name.

Usage:
  python listener.py --port 6000 --service-port 5000

"""
import argparse
import json
import socket
import platform
import sys


def make_socket(listen_port: int):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    # allow reuse
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    except Exception:
        pass
    # On Windows SO_REUSEPORT may not be available
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    except Exception:
        pass

    # Bind to all interfaces
    s.bind(("", listen_port))
    return s


def run_listener(discovery_port: int, service_port: int, name: str):
    sock = make_socket(discovery_port)
    print(f"Listening for discovery requests on UDP port {discovery_port} (advertising {name}:{service_port})")

    try:
        while True:
            data, addr = sock.recvfrom(2048)
            try:
                req = json.loads(data.decode('utf-8'))
            except Exception:
                # fall back to raw matching
                raw = data.decode('utf-8', errors='ignore')
                if 'DISCOVER_REQUEST' in raw:
                    req = {'type': 'DISCOVER_REQUEST'}
                else:
                    req = {'raw': raw}

            if req.get('type') == 'DISCOVER_REQUEST' or 'DISCOVER_REQUEST' in req.get('raw', ''):
                print(f"Discovery request from {addr[0]}:{addr[1]} -> {req}")
                resp = {
                    'type': 'LISTENER_HERE',
                    'hostname': platform.node(),
                    'service_port': service_port,
                    'name': name,
                }
                try:
                    sock.sendto(json.dumps(resp).encode('utf-8'), addr)
                except Exception as e:
                    print('Reply error:', e)

    except KeyboardInterrupt:
        print('\nStopping listener')
    except Exception as e:
        print('Listener error:', e)
    finally:
        sock.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', '--discovery-port', dest='port', type=int, default=6000,
                        help='Discovery UDP port to listen on')
    parser.add_argument('--service-port', type=int, default=5000, help='Local service port to advertise')
    parser.add_argument('--name', type=str, default='sureroute-backend', help='Service name')
    args = parser.parse_args()

    # On some systems binding to the port requires privileges - fail fast
    try:
        run_listener(args.port, args.service_port, args.name)
    except PermissionError:
        print(f"Permission denied binding to port {args.port}. Try running as admin or pick a different port.")
        sys.exit(1)


if __name__ == '__main__':
    main()
