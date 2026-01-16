#!/usr/bin/env python3
"""
Simple HTTP server for frontend development
Serves static files for the Sports Evaluation System frontend
"""

import http.server
import socketserver
import os
from typing import Optional

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with CORS support"""
    
    def end_headers(self) -> None:
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_frontend_server(port: int = 8000, directory: Optional[str] = None) -> None:
    """Start the frontend development server"""
    if directory:
        os.chdir(directory)
    
    with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
        print("🌐 Frontend Development Server")
        print("📁 Sports Evaluation System - Frontend")
        print(f"🚀 Server: http://localhost:{port}")
        print("🔗 Backend API: http://localhost:3000/api")
        print("✋ Press Ctrl+C to stop")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Frontend server stopped")

if __name__ == '__main__':
    # Set the current directory to the frontend folder
    frontend_dir = os.path.dirname(os.path.abspath(__file__))
    start_frontend_server(8000, frontend_dir)
