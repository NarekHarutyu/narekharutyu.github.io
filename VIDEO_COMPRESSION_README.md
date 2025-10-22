# Video Compression Guide

This guide explains how to compress your robot videos for optimal web performance.

## Prerequisites

Install ffmpeg (required for video compression):

```bash
brew install ffmpeg
```

## Two Compression Options

### Option 1: Standard Compression (Recommended)
**Script:** `compress_videos.py`

Good balance between file size and quality.

**Settings:**
- Resolution: Up to 1280x720 (720p)
- Frame rate: 24 fps
- Quality: CRF 28 (good quality, well compressed)
- Audio: 64kbps

**Expected reduction:** 60-80% file size reduction

**Usage:**
```bash
python3 compress_videos.py
```

### Option 2: Ultra-Aggressive Compression
**Script:** `compress_videos_aggressive.py`

Maximum size reduction for smallest possible files.

**Settings:**
- Resolution: Up to 854x480 (480p)
- Frame rate: 20 fps
- Quality: CRF 32 (lower quality, maximum compression)
- Audio: 32kbps

**Expected reduction:** 80-90% file size reduction

**Usage:**
```bash
python3 compress_videos_aggressive.py
```

## Step-by-Step Process

1. **Run compression script:**
   ```bash
   python3 compress_videos.py
   # or for more aggressive compression:
   python3 compress_videos_aggressive.py
   ```

2. **Review the output:**
   - Compressed videos will be saved to `assets/robots_compressed/`
   - Check the quality and file sizes

3. **Test a few videos:**
   - Open some compressed videos to verify quality is acceptable
   - All videos will be converted to `.mp4` format

4. **Backup and replace (if satisfied):**
   ```bash
   # Create backup of originals
   mkdir -p assets/robots_backup
   cp -r assets/robots/* assets/robots_backup/
   
   # Replace with compressed versions
   rm assets/robots/*.mov assets/robots/*.MOV assets/robots/*.MP4
   mv assets/robots_compressed/* assets/robots/
   ```

5. **Clean up:**
   ```bash
   rmdir assets/robots_compressed
   ```

## What the Scripts Do

1. ✅ Compress all videos in `assets/robots/`
2. ✅ Reduce resolution (720p or 480p)
3. ✅ Lower frame rate (24fps or 20fps)
4. ✅ Strip unnecessary metadata
5. ✅ Optimize for web streaming (fast start)
6. ✅ Convert all to MP4 format
7. ✅ Reduce audio bitrate

## File Size Examples

Typical compression results:
- 50 MB video → 8-15 MB (standard)
- 50 MB video → 3-8 MB (aggressive)
- 100 MB video → 15-30 MB (standard)
- 100 MB video → 5-15 MB (aggressive)

## Tips

- Start with **standard compression** first
- Use **aggressive compression** only if files are still too large
- Always backup your original videos before replacing
- Test videos on your website before deleting originals
- The gallery will work with compressed videos automatically

## Troubleshooting

**Error: "ffmpeg is not installed"**
- Run: `brew install ffmpeg`

**Videos won't play:**
- MP4 format is universally supported
- Check browser console for errors

**Quality too low:**
- Use standard compression instead of aggressive
- Or edit the CRF value in the script (lower = better quality)

## Advanced Customization

Edit the `VIDEO_SETTINGS` dictionary in either script:

```python
VIDEO_SETTINGS = {
    'crf': '28',          # Lower = better quality (18-32)
    'max_width': '1280',  # Maximum width in pixels
    'max_height': '720',  # Maximum height in pixels
    'fps': '24',          # Frame rate
}
```

- **CRF values:** 18 (high quality) to 32 (very compressed)
- **Resolution:** Adjust width/height as needed
- **FPS:** 24-30 is good for web

---

**Questions?** Check ffmpeg documentation: https://ffmpeg.org/

