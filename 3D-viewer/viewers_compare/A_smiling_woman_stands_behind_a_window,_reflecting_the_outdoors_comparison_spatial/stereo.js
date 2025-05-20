import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, mesh1, mesh2, video;
let playCount = 0; // Track how many times the video has played
const maxPlays = 3; // Set how many times the video should replay
const pauseFrame = 44; // Frame to pause on
const fps = 16; // Frame rate of the video

// Use the new aspect ratio for your videos
const VIDEO_ASPECT = (1024 + 100) / 512; // 2.195

init();

function init() {
  const container = document.getElementById('container');

  // --- VIDEO ---
  video = document.getElementById('video');

  // Ensure video starts on user interaction (important for mobile)
  container.addEventListener('click', () => {
    if (playCount < maxPlays) {
      video
        .play()
        .then(() => {
          console.log('Video started successfully');
        })
        .catch((error) => {
          console.error('Error starting video:', error);
        });
    }
  });

  // Wait until the video can play
  video.addEventListener(
    'canplay',
    () => {
      console.log('Video is ready to play');
      video.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    },
    { once: true }
  );

  // Event listener for when the video ends
  video.addEventListener('ended', () => {
    playCount++;
    console.log(`Video ended. Play count: ${playCount}`);
    if (playCount < maxPlays) {
      video.play(); // Replay the video
    } else if (playCount === maxPlays) {
      pauseVideoAtFrame(pauseFrame); // Pause at the specified frame
    }
  });

  // Function to pause the video at a specific frame
  function pauseVideoAtFrame(frame) {
    const targetTime = frame / fps; // Calculate the time for the frame
    video.currentTime = targetTime; // Seek to the target frame time
    console.log(`Seeking to ${targetTime}s (frame ${frame})`);

    // Ensure the video pauses after seeking
    const onSeeked = () => {
      video.pause(); // Pause the video
      console.log(`Paused video at frame ${frame} (time: ${video.currentTime}s)`);
      video.removeEventListener('seeked', onSeeked); // Remove the seeked listener
    };

    video.addEventListener('seeked', onSeeked);
  }

  // Create a video texture
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101010);

  // --- Camera ---
  // Use VIDEO_ASPECT here
  camera = new THREE.PerspectiveCamera(70, VIDEO_ASPECT, 1, 2000);
  camera.layers.enable(1); // left-eye layer

  // Left-eye quad
  // Adjust the plane size to match the new aspect ratio
  const geometry1 = new THREE.PlaneGeometry(VIDEO_ASPECT, 1);
  const uvs1 = geometry1.attributes.uv.array;
  for (let i = 0; i < uvs1.length; i += 2) {
    // scale u from 0..1 to 0..0.5
    uvs1[i] *= 0.5;
  }
  const material1 = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  mesh1 = new THREE.Mesh(geometry1, material1);
  mesh1.layers.set(1);
  scene.add(mesh1);

  // Right-eye quad
  const geometry2 = new THREE.PlaneGeometry(VIDEO_ASPECT, 1);
  const uvs2 = geometry2.attributes.uv.array;
  for (let i = 0; i < uvs2.length; i += 2) {
    uvs2[i] *= 0.5; // 0..1 → 0..0.5
    uvs2[i] += 0.5; // shift → 0.5..1.0
  }
  const material2 = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  mesh2 = new THREE.Mesh(geometry2, material2);
  mesh2.layers.set(2);
  scene.add(mesh2);

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Calculate a VIDEO_ASPECT:1 viewport that fits in current window
  setViewportSize();

  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');

  container.appendChild(renderer.domElement);

  // Create/append the VR button
  document.body.appendChild(VRButton.createButton(renderer));

  window.addEventListener('resize', onWindowResize);

  // Start animation
  renderer.setAnimationLoop(animate);
}

function pauseVideoAtFrame(frame) {
  const targetTime = frame / fps; // Calculate time for the frame
  video.currentTime = targetTime; // Seek to the target frame time
  console.log(`Seeking to ${targetTime}s (frame ${frame})`);

  const onSeeked = () => {
    video.pause(); // Ensure the video pauses after seeking
    console.log(`Paused video at frame ${frame} (time: ${video.currentTime}s)`);
    video.removeEventListener('seeked', onSeeked); // Remove this listener
    video.removeEventListener('ended', onEnded); // Remove the ended listener
  };

  const onEnded = () => {
    console.log('Playback has already been stopped.');
  };

  video.addEventListener('seeked', onSeeked);
  video.addEventListener('ended', onEnded);
}

function onWindowResize() {
  setViewportSize();
}

function setViewportSize() {
  // We want width : height = VIDEO_ASPECT : 1,
  // but we must also ensure it fits in the current window.

  const maxW = window.innerWidth;
  const maxH = window.innerHeight;

  let w = maxW;
  let h = w / VIDEO_ASPECT; // use the new aspect ratio

  // If that height is too tall for the window, scale down
  if (h > maxH) {
    h = maxH;
    w = h * VIDEO_ASPECT;
  }

  // Now set renderer and camera
  renderer.setSize(w, h);
  camera.aspect = VIDEO_ASPECT; // preserve our custom aspect ratio
  camera.updateProjectionMatrix();
}

function animate() {
  // Position both quads about 3m in front of the camera, facing it
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  const frontPosition = camera.position
    .clone()
    .add(cameraDirection.clone().multiplyScalar(3));

  mesh1.position.copy(frontPosition);
  mesh1.quaternion.copy(camera.quaternion);

  mesh2.position.copy(frontPosition);
  mesh2.quaternion.copy(camera.quaternion);

  renderer.render(scene, camera);
}