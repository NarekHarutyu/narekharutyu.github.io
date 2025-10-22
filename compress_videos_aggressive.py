#!/usr/bin/env python3
"""
ULTRA-AGGRESSIVE Video Compression for Maximum Size Reduction
This creates very small files - use for maximum web optimization when quality is less critical.
"""

import os
import subprocess
import sys
from pathlib import Path

# Configuration
INPUT_DIR = "assets/robots"
OUTPUT_DIR = "assets/robots_compressed"

# ULTRA-AGGRESSIVE settings for minimum file size
VIDEO_SETTINGS = {
    'codec': 'libx264',
    'preset': 'slow',
    'crf': '32',                  # Very high CRF = much smaller files (lower quality)
    'max_width': '854',           # 480p width
    'max_height': '480',          # 480p height
    'fps': '20',                  # Lower frame rate
    'audio_codec': 'aac',
    'audio_bitrate': '32k',       # Minimal audio bitrate
    'pixel_format': 'yuv420p',
}

def check_ffmpeg():
    """Check if ffmpeg is installed."""
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_video_files(directory):
    """Get all video files from the directory."""
    video_extensions = {'.mov', '.MOV', '.mp4', '.MP4', '.avi', '.AVI', '.mkv', '.MKV'}
    video_files = []
    
    for file in Path(directory).iterdir():
        if file.is_file() and file.suffix in video_extensions:
            video_files.append(file)
    
    return sorted(video_files)

def get_file_size_mb(file_path):
    """Get file size in MB."""
    return os.path.getsize(file_path) / (1024 * 1024)

def compress_video(input_path, output_path):
    """Compress a single video file with ultra-aggressive settings."""
    print(f"\n{'='*60}")
    print(f"Compressing: {input_path.name}")
    print(f"Original size: {get_file_size_mb(input_path):.2f} MB")
    
    # Build ffmpeg command with ultra-aggressive compression
    cmd = [
        'ffmpeg',
        '-i', str(input_path),
        '-c:v', VIDEO_SETTINGS['codec'],
        '-preset', VIDEO_SETTINGS['preset'],
        '-crf', VIDEO_SETTINGS['crf'],
        '-vf', f"scale='min({VIDEO_SETTINGS['max_width']},iw)':'min({VIDEO_SETTINGS['max_height']},ih)':force_original_aspect_ratio=decrease",
        '-r', VIDEO_SETTINGS['fps'],
        '-c:a', VIDEO_SETTINGS['audio_codec'],
        '-b:a', VIDEO_SETTINGS['audio_bitrate'],
        '-pix_fmt', VIDEO_SETTINGS['pixel_format'],
        '-movflags', '+faststart',
        '-map_metadata', '-1',
        '-y',
        str(output_path)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        
        compressed_size = get_file_size_mb(output_path)
        original_size = get_file_size_mb(input_path)
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        print(f"✓ Compressed size: {compressed_size:.2f} MB")
        print(f"✓ Reduction: {reduction:.1f}%")
        
        return True, original_size, compressed_size
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Error compressing {input_path.name}")
        print(f"Error details: {e.stderr}")
        return False, 0, 0

def main():
    """Main compression workflow."""
    print("="*60)
    print("ULTRA-AGGRESSIVE VIDEO COMPRESSION")
    print("Maximum size reduction - lower quality output")
    print("="*60)
    
    if not check_ffmpeg():
        print("\n❌ ERROR: ffmpeg is not installed!")
        print("\nTo install: brew install ffmpeg")
        sys.exit(1)
    
    output_dir = Path(OUTPUT_DIR)
    output_dir.mkdir(exist_ok=True)
    
    input_dir = Path(INPUT_DIR)
    if not input_dir.exists():
        print(f"\n❌ ERROR: Directory '{INPUT_DIR}' not found!")
        sys.exit(1)
    
    video_files = get_video_files(input_dir)
    
    if not video_files:
        print(f"\n❌ No video files found in '{INPUT_DIR}'")
        sys.exit(1)
    
    print(f"\n✓ Found {len(video_files)} video file(s)")
    print(f"\nULTRA-AGGRESSIVE settings:")
    print(f"  - Resolution: {VIDEO_SETTINGS['max_width']}x{VIDEO_SETTINGS['max_height']} (480p)")
    print(f"  - Frame rate: {VIDEO_SETTINGS['fps']} fps")
    print(f"  - Quality (CRF): {VIDEO_SETTINGS['crf']} (very compressed)")
    print(f"  - Audio bitrate: {VIDEO_SETTINGS['audio_bitrate']}")
    print(f"\n⚠️  WARNING: This will produce VERY small files with reduced quality")
    
    response = input("\nProceed? (y/n): ").lower().strip()
    
    if response != 'y':
        print("Cancelled.")
        sys.exit(0)
    
    total_original = 0
    total_compressed = 0
    successful = 0
    
    for i, video_file in enumerate(video_files, 1):
        print(f"\n[{i}/{len(video_files)}]")
        output_filename = video_file.stem + '.mp4'
        output_path = output_dir / output_filename
        
        success, orig_size, comp_size = compress_video(video_file, output_path)
        
        if success:
            successful += 1
            total_original += orig_size
            total_compressed += comp_size
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✓ Compressed: {successful}/{len(video_files)}")
    
    if successful > 0:
        total_reduction = ((total_original - total_compressed) / total_original) * 100
        print(f"\nOriginal: {total_original:.2f} MB")
        print(f"Compressed: {total_compressed:.2f} MB")
        print(f"Saved: {total_original - total_compressed:.2f} MB ({total_reduction:.1f}%)")
        print(f"\n✓ Videos saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

