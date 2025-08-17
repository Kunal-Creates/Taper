#!/usr/bin/env python3
"""
Optional Python server for Tape 3D Generator
Provides secure API key handling and enhanced functionality
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TapeServerHandler(SimpleHTTPRequestHandler):
    """Enhanced HTTP handler for Tape application"""
    
    def __init__(self, *args, **kwargs):
        # Configure Gemini AI
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("Warning: GEMINI_API_KEY not found in environment")
        
        super().__init__(*args, **kwargs)
    
    def do_POST(self):
        """Handle POST requests for API endpoints"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/generate':
            self.handle_generate_request()
        else:
            self.send_error(404, "Endpoint not found")
    
    def handle_generate_request(self):
        """Handle 3D object generation requests"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            prompt = request_data.get('prompt', '')
            if not prompt:
                self.send_error(400, "Prompt is required")
                return
            
            if not self.model:
                self.send_error(500, "Gemini API not configured")
                return
            
            # Generate 3D object code
            enhanced_prompt = self.create_enhanced_prompt(prompt)
            response = self.model.generate_content(enhanced_prompt)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {
                'success': True,
                'code': response.text,
                'prompt': prompt
            }
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            print(f"Error generating object: {e}")
            self.send_error(500, f"Generation failed: {str(e)}")
    
    def create_enhanced_prompt(self, user_prompt: str) -> str:
        """Create an enhanced prompt for better 3D object generation"""
        return f"""
        You are an expert Three.js developer. Generate ONLY JavaScript code to create a 3D object.
        
        REQUIREMENTS:
        - The final object/group MUST be assigned to a variable named 'object'
        - Add an 'animate' function to 'object.userData' for smooth animation
        - Use appropriate Three.js geometries, materials, and groups
        - Include realistic materials with proper metalness, roughness, and color
        - Add shadows with 'castShadow = true' and 'receiveShadow = true'
        - Create interesting animations (rotation, scaling, position changes)
        - Use advanced materials like MeshStandardMaterial or MeshPhysicalMaterial
        
        DO NOT INCLUDE:
        - Scene, camera, renderer, or lighting setup
        - Import statements or external dependencies
        - Markdown backticks or code blocks
        - Comments or explanations
        
        User request: "{user_prompt}"
        
        Generate the code:
        """
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    """Start the Tape development server"""
    port = int(os.getenv('PORT', 8000))
    
    print(f"""
    🎨 Tape 3D Generator Server
    
    Server starting on http://localhost:{port}
    
    Features:
    - Static file serving
    - Secure API key handling
    - Enhanced 3D generation
    
    Press Ctrl+C to stop
    """)
    
    server = HTTPServer(('localhost', port), TapeServerHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        server.shutdown()

if __name__ == '__main__':
    main()