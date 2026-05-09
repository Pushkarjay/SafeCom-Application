#!/usr/bin/env python3
"""
Generate Mermaid diagrams as SVG/PNG for SafeCom Architecture
Requires: pip install mermaid-cli
Run: npx -y @mermaid-js/mermaid-cli -i source/ -o ../images -t dark
"""

import os
import sys
import subprocess

SOURCE_DIR = "source"
OUTPUT_DIR = "images"

def main():
    print("=" * 60)
    print("SafeCom Architecture - Visual Generator")
    print("=" * 60)
    print()
    print("To generate diagrams:")
    print("1. Install Node.js: https://nodejs.org")
    print("2. Run: npm install -g @mermaid-js/mermaid-cli")
    print("3. Run: npx -y @mermaid-js/mermaid-cli -i source/*.mmd -o ../images -t dark")
    print()
    print("Available source files:")
    
    source_path = os.path.dirname(os.path.abspath(__file__))
    mmd_files = [f for f in os.listdir(source_path) if f.endswith('.mmd')]
    
    for f in sorted(mmd_files):
        print(f"  - {f}")
    
    print()
    print("Or use the generate_all.py script for batch processing")
    return 0

if __name__ == "__main__":
    sys.exit(main())