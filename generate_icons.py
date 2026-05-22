#!/usr/bin/env python3
"""
Generate PWA icons for Pi Dashboard
Creates simple SVG-based icons in various sizes
"""

import os
from pathlib import Path

def create_svg_icon(size):
    """Create an SVG icon with the specified size"""
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="{size}" height="{size}" fill="url(#grad1)" rx="{size * 0.15}"/>
  
  <!-- Server icon -->
  <g transform="translate({size * 0.2}, {size * 0.25})">
    <!-- Top server -->
    <rect x="0" y="0" width="{size * 0.6}" height="{size * 0.15}" fill="white" opacity="0.9" rx="{size * 0.02}"/>
    <circle cx="{size * 0.1}" cy="{size * 0.075}" r="{size * 0.025}" fill="#667eea"/>
    <rect x="{size * 0.2}" y="{size * 0.055}" width="{size * 0.35}" height="{size * 0.04}" fill="#667eea" opacity="0.3" rx="{size * 0.01}"/>
    
    <!-- Bottom server -->
    <rect x="0" y="{size * 0.25}" width="{size * 0.6}" height="{size * 0.15}" fill="white" opacity="0.9" rx="{size * 0.02}"/>
    <circle cx="{size * 0.1}" cy="{size * 0.325}" r="{size * 0.025}" fill="#764ba2"/>
    <rect x="{size * 0.2}" y="{size * 0.305}" width="{size * 0.35}" height="{size * 0.04}" fill="#764ba2" opacity="0.3" rx="{size * 0.01}"/>
  </g>
  
  <!-- Activity indicator -->
  <circle cx="{size * 0.75}" cy="{size * 0.75}" r="{size * 0.08}" fill="#48bb78"/>
  <circle cx="{size * 0.75}" cy="{size * 0.75}" r="{size * 0.05}" fill="white"/>
</svg>'''
    return svg_content

def main():
    """Generate icons in various sizes"""
    icon_dir = Path(__file__).parent / 'static' / 'icons'
    icon_dir.mkdir(parents=True, exist_ok=True)
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("Generating PWA icons...")
    
    for size in sizes:
        icon_path = icon_dir / f'icon-{size}x{size}.png'
        svg_path = icon_dir / f'icon-{size}x{size}.svg'
        
        # Create SVG
        svg_content = create_svg_icon(size)
        with open(svg_path, 'w') as f:
            f.write(svg_content)
        
        print(f"✓ Created {svg_path.name}")
        
        # Try to convert to PNG using available tools
        try:
            # Try using ImageMagick
            os.system(f'convert {svg_path} {icon_path} 2>/dev/null')
            if icon_path.exists():
                print(f"✓ Converted to {icon_path.name}")
            else:
                print(f"  Note: PNG conversion failed, using SVG. Install ImageMagick for PNG icons.")
        except:
            print(f"  Note: Install ImageMagick to generate PNG icons automatically")
    
    print("\n✨ Icon generation complete!")
    print("Note: SVG icons created. For PNG icons, install ImageMagick and run this script again.")
    print("      Or manually convert SVGs to PNGs using your preferred tool.")

if __name__ == '__main__':
    main()
