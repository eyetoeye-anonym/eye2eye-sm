#!/usr/bin/env python3
import os
import glob
import torch
import torchvision.io as tvio
import torchvision.transforms as T
import torchvision.transforms.functional as F
from pathlib import Path

# Set torch device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Define video directories to search
video_directories = [
    "static/ablations_for_website",
    "static/stereo-videos",
    "static/stereocrafter_public"
]

# Define target video patterns
target_patterns = ["*ours.mp4", "*warp_inpaint.mp4", "*left_right.mp4", "*sbs.mp4"]

def sbs_to_anaglyph(video_path, output_path):
    """
    Convert a side-by-side video to anaglyph format.
    
    Args:
        video_path: Path to the side-by-side video
        output_path: Path to save the anaglyph video
    """
    print(f"Processing: {video_path}")
    
    # try:
    # Read the video
    video_frames, _, metadata = tvio.read_video(video_path, pts_unit="sec")
    
    # Get video information
    num_frames, height, width, channels = video_frames.shape
    fps = metadata["video_fps"]
    
    print(f"Video info: {num_frames} frames, {width}x{height}, {fps} fps")
    
    # Calculate midpoint for SBS format
    left_frame = video_frames[:, :, :width // 2, :]
    right_frame = video_frames[:, :, width // 2:, :]
    
    # Create output frames
    anaglyph_frames = torch.zeros((num_frames, height, width // 2, channels), dtype=torch.uint8)
    anaglyph_frames[:, :, :, 0] = left_frame[:, :, :, 0]
    anaglyph_frames[:, :, :, 1] = right_frame[:, :, :, 1]
    anaglyph_frames[:, :, :, 2] = right_frame[:, :, :, 2]

    # Write the output video
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare frames for writing - shape should be [T, H, W, C]
    anaglyph_frames = anaglyph_frames.to(torch.uint8)
    
    # Write video using PyTorch's video writer
    tvio.write_video(
        output_path,
        anaglyph_frames,
        fps=fps,
        video_codec="h264"
    )
    
    print(f"Saved anaglyph video to: {output_path}")
        # return True
    
    # except Exception as e:
    #     print(f"Error processing {video_path}: {e}")
    #     return False

def main():
    """Main function to process all target videos."""
    # Track processed files
    processed_count = 0
    error_count = 0
    
    # Process each directory
    for base_dir in video_directories:
        print(f"\nSearching in: {base_dir}")
        
        # Walk through all subdirectories
        for root, _, _ in os.walk(base_dir):
            # Check for each target pattern
            for pattern in target_patterns:
                # Find all matching videos
                for video_path in glob.glob(os.path.join(root, pattern)):
                    # Skip if already an anaglyph
                    if "anaglyph" in video_path:
                        continue
                    
                    # Create output path
                    filename = os.path.basename(video_path)
                    basename, ext = os.path.splitext(filename)
                    output_filename = f"{basename}_anaglyph{ext}"
                    output_path = os.path.join(os.path.dirname(video_path), output_filename)
                    
                    # Process the video
                    success = sbs_to_anaglyph(video_path, output_path)
                    
                    if success:
                        processed_count += 1
                    else:
                        error_count += 1

    
    print(f"\nProcessing complete!")
    print(f"Successfully processed: {processed_count} videos")
    print(f"Errors encountered: {error_count} videos")

if __name__ == "__main__":
    main() 