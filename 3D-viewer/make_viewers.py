import os
import shutil

STEREO_JS_SOURCE='3D-viewer/example/stereo.js'
STEREO_JS_SOURCE_AR2 = '3D-viewer/example_ar_2_195/stereo.js'
SAVE_PATH = 'viewers'
PAIRS_USER_STUDY_PATH = "../static/stereo-videos"  # https path used inside <source>
VIDEOS_LOCAL_PATH = "static/stereo-videos"


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <title>360 stereo video</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link type="text/css" rel="stylesheet" href="../../css/main.css">
    <script type="importmap">
        {{
          "imports": {{
            "three": "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/"
          }}
        }}
    </script>
</head>
<body>
    <div id="container" style="position: absolute; top: 50%; left: 50%; 
         transform: translate(-50%, -50%); display: flex; 
         justify-content: center; align-items: center; width: auto; height: auto;">
    </div>
    
    <video id="video" autoplay muted crossorigin="anonymous" playsinline style="display:none">
      <source src="{commented_path}" type="video/webm">
    </video>
    
    <script type="module" src="stereo.js"></script>
</body>
</html>
"""
#       <source src="{actual_path}" type="video/mp4">
def create_html(prompt_name: str, result: str) -> str:
    """
    Generate the HTML content for a given prompt and result.
    E.g. result can be 'ours' or 'depth_c'.
    """
    commented_path = f"{PAIRS_USER_STUDY_PATH}/{prompt_name}/{result}.webm"
    # actual_path = f"{PAIRS_USER_STUDY_PATH}/{prompt_name}/{result}.mp4"
    
    return HTML_TEMPLATE.format(
        commented_path=commented_path,
    )

def main():
    VIEWER_TYPE = 'spatial_compare' # | 'temporal_compare' | 'spatial_compare' | 'seperate'
    assert VIEWER_TYPE in ['seperate', 'temporal_compare', 'spatial_compare'], "Invalid viewer type"
    # Go through each item in the video folder
    for prompt in os.listdir(VIDEOS_LOCAL_PATH):
        # if not 'kitchen' in prompt:
        #     continue
        print(prompt)
        if VIEWER_TYPE == 'seperate':
        # Create subfolders for each result type
            ours_folder = os.path.join(SAVE_PATH, f"{prompt}_ours")
            # warp_inpaint_folder = os.path.join(SAVE_PATH, f"{prompt}_warp_inpaint")
            
            os.makedirs(ours_folder, exist_ok=True)
            # os.makedirs(warp_inpaint_folder, exist_ok=True)
            
            # Generate the HTML for each result
            ours_html = create_html(prompt, "ours")
            # warp_inpaint_html = create_html(prompt, "warp_inpaint")
            
            # Write index.html into each subfolder
            with open(os.path.join(ours_folder, "index.html"), "w", encoding="utf-8") as f:
                f.write(ours_html)
            
            # with open(os.path.join(warp_inpaint_folder, "index.html"), "w", encoding="utf-8") as f:
            #     f.write(warp_inpaint_html)
            
            # Copy stereo.js to each subfolder
            shutil.copy2(STEREO_JS_SOURCE, ours_folder)
            # shutil.copy2(STEREO_JS_SOURCE, warp_inpaint_folder)
            print(f"Created HTML for prompt: {prompt}")
        
        else:
            if prompt.startswith('.'):
                continue
            filename = 'comparison_temporal' if  VIEWER_TYPE == 'temporal_compare' else 'comparison_spatial'
            commented_path = f"{VIDEOS_LOCAL_PATH}/{prompt}/{filename}.webm"
            if not os.path.exists(commented_path):
                print(f"No {commented_path}")
                continue
            prompt_folder = os.path.join(SAVE_PATH, f"{prompt}_{filename}")
            os.makedirs(prompt_folder, exist_ok=True)
            
            # Generate the HTML for each result
            html = create_html(prompt, filename)
            
            # Write index.html into each subfolder
            with open(os.path.join(prompt_folder, "index.html"), "w", encoding="utf-8") as f:
                f.write(html)
            shutil.copy2(STEREO_JS_SOURCE, prompt_folder) if VIEWER_TYPE == 'temporal_compare' else shutil.copy2(STEREO_JS_SOURCE_AR2, prompt_folder)

if __name__ == "__main__":
    main()