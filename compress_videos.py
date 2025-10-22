#!/usr/bin/env python3
"""
Video Compression Script for Website Optimization
Significantly reduces video file sizes while maintaining acceptable quality for web viewing.
"""

import os
import subprocess
import sys
from pathlib import Path

# Configuration
INPUT_DIR = "assets/robots"
OUTPUT_DIR = "assets/robots_compressed"
BACKUP_DIR = "assets/robots_backup"

# Video compression settings for maximum size reduction
VIDEO_SETTINGS = {
    'codec': 'libx264',           # H.264 codec for broad compatibility
    'preset': 'slow',             # Slower encoding = better compression
    'crf': '28',                  # Constant Rate Factor: 28 = very compressed (18-28 range, higher = smaller)
    'max_width': '1280',          # Max width (maintains aspect ratio)
    'max_height': '720',          # Max height (720p max)
    'fps': '24',                  # Reduce frame rate to 24fps
    'audio_codec': 'aac',         # AAC audio codec
    'audio_bitrate': '64k',       # Very low audio bitrate
    'strip_metadata': True,       # Remove metadata to save space
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
    """Compress a single video file with aggressive settings."""
    print(f"\n{'='*60}")
    print(f"Compressing: {input_path.name}")
    print(f"Original size: {get_file_size_mb(input_path):.2f} MB")
    
    # Build ffmpeg command for maximum compression
    # Note: pad to even dimensions to avoid encoding errors
    cmd = [
        'ffmpeg',
        '-i', str(input_path),
        '-c:v', VIDEO_SETTINGS['codec'],
        '-preset', VIDEO_SETTINGS['preset'],
        '-crf', VIDEO_SETTINGS['crf'],
        '-vf', f"scale='min({VIDEO_SETTINGS['max_width']},iw)':'min({VIDEO_SETTINGS['max_height']},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
        '-r', VIDEO_SETTINGS['fps'],
        '-c:a', VIDEO_SETTINGS['audio_codec'],
        '-b:a', VIDEO_SETTINGS['audio_bitrate'],
        '-movflags', '+faststart',  # Enable fast start for web streaming
        '-y',  # Overwrite output file if exists
    ]
    
    # Strip metadata
    if VIDEO_SETTINGS['strip_metadata']:
        cmd.extend(['-map_metadata', '-1'])
    
    cmd.append(str(output_path))
    
    try:
        # Run ffmpeg with progress
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
    print("VIDEO COMPRESSION TOOL FOR WEB OPTIMIZATION")
    print("="*60)
    
    # Check for ffmpeg
    if not check_ffmpeg():
        print("\n❌ ERROR: ffmpeg is not installed!")
        print("\nTo install ffmpeg:")
        print("  macOS: brew install ffmpeg")
        print("  Ubuntu/Debian: sudo apt-get install ffmpeg")
        print("  Windows: Download from https://ffmpeg.org/download.html")
        sys.exit(1)
    
    print("✓ ffmpeg found")
    
    # Create directories
    output_dir = Path(OUTPUT_DIR)
    backup_dir = Path(BACKUP_DIR)
    output_dir.mkdir(exist_ok=True)
    
    # Get video files
    input_dir = Path(INPUT_DIR)
    if not input_dir.exists():
        print(f"\n❌ ERROR: Directory '{INPUT_DIR}' not found!")
        sys.exit(1)
    
    video_files = get_video_files(input_dir)
    
    if not video_files:
        print(f"\n❌ No video files found in '{INPUT_DIR}'")
        sys.exit(1)
    
    print(f"\n✓ Found {len(video_files)} video file(s) to compress")
    
    # Show settings
    print(f"\nCompression settings:")
    print(f"  - Max resolution: {VIDEO_SETTINGS['max_width']}x{VIDEO_SETTINGS['max_height']}")
    print(f"  - Frame rate: {VIDEO_SETTINGS['fps']} fps")
    print(f"  - Quality (CRF): {VIDEO_SETTINGS['crf']} (higher = smaller file)")
    print(f"  - Audio bitrate: {VIDEO_SETTINGS['audio_bitrate']}")
    
    # Ask for confirmation
    print(f"\nOutput directory: {OUTPUT_DIR}")
    response = input("\nProceed with compression? (y/n): ").lower().strip()
    
    if response != 'y':
        print("Compression cancelled.")
        sys.exit(0)
    
    # Process videos
    total_original = 0
    total_compressed = 0
    successful = 0
    failed = 0
    
    for i, video_file in enumerate(video_files, 1):
        print(f"\n[{i}/{len(video_files)}]")
        
        # Output filename (convert to .mp4)
        output_filename = video_file.stem + '.mp4'
        output_path = output_dir / output_filename
        
        success, orig_size, comp_size = compress_video(video_file, output_path)
        
        if success:
            successful += 1
            total_original += orig_size
            total_compressed += comp_size
        else:
            failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("COMPRESSION SUMMARY")
    print("="*60)
    print(f"✓ Successfully compressed: {successful}/{len(video_files)}")
    if failed > 0:
        print(f"✗ Failed: {failed}/{len(video_files)}")
    
    if successful > 0:
        total_reduction = ((total_original - total_compressed) / total_original) * 100
        print(f"\nTotal original size: {total_original:.2f} MB")
        print(f"Total compressed size: {total_compressed:.2f} MB")
        print(f"Total space saved: {total_original - total_compressed:.2f} MB ({total_reduction:.1f}%)")
        
        print(f"\n✓ Compressed videos saved to: {OUTPUT_DIR}")
        print(f"\nTo use compressed videos:")
        print(f"  1. Review videos in '{OUTPUT_DIR}' folder")
        print(f"  2. If satisfied, backup originals: mkdir -p {BACKUP_DIR} && mv {INPUT_DIR}/* {BACKUP_DIR}/")
        print(f"  3. Move compressed videos: mv {OUTPUT_DIR}/* {INPUT_DIR}/")
        print(f"  4. The website will automatically use the compressed versions")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    main()

