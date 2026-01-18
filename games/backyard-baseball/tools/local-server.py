#!/usr/bin/env python3
"""
Local development server for Backyard Baseball WebGL build.
Serves files with correct MIME types and CORS headers for Unity WebGL.
"""

import http.server
import socketserver
import os
import sys
from functools import partial

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web')

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with CORS and proper MIME types for Unity WebGL."""

    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.wasm': 'application/wasm',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.symbols.json': 'application/json',
        '.unityweb': 'application/octet-stream',
    }

    def end_headers(self):
        self.send_cors_headers()
        super().end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')

        path = self.translate_path(self.path)
        if path.endswith('.br'):
            self.send_header('Content-Encoding', 'br')
        elif path.endswith('.gz'):
            self.send_header('Content-Encoding', 'gzip')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def guess_type(self, path):
        base, ext = os.path.splitext(path)

        if ext in ['.br', '.gz']:
            base, inner_ext = os.path.splitext(base)
            ext = inner_ext

        if ext in self.extensions_map:
            return self.extensions_map[ext]

        return super().guess_type(path)


def main():
    os.chdir(DIRECTORY)
    print(f"Serving {DIRECTORY} at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")

    handler = partial(CORSRequestHandler, directory=DIRECTORY)

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
