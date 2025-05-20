import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, mesh1, mesh2;

init();

function init() {
  const container = document.getElementById('container');

  // Ensure the video starts on a click/tap (mobile browsers often require user interaction)
  container.addEventListener('click', function() {
    video.play();
  });

  // Grab the video element
  const video = document.getElementById('video');
  video.play();

  // Create a video texture
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101010);

  // --- Camera (force aspect = 1) ---
  camera = new THREE.PerspectiveCamera(70, 1.0, 1, 2000);
  // Renders left view when no stereo available
  camera.layers.enable(1);

  // --- Left-eye quad (1:1 geometry) ---
  // If your stereo video is side-by-side, each half is effectively 1:1.
  // PlaneGeometry(width, height). We’ll use 1×1.
  const geometry1 = new THREE.PlaneGeometry(1, 1);

  // Adjust the UVs so that this mesh only displays the *left* half of the video (0.0 → 0.5).
  const uvs1 = geometry1.attributes.uv.array;
  for (let i = 0; i < uvs1.length; i += 2) {
    // u coords
    uvs1[i] *= 0.5; // 0 → 0.5
  }

  const material1 = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  mesh1 = new THREE.Mesh(geometry1, material1);
  // Left eye only
  mesh1.layers.set(1);
  scene.add(mesh1);

  // --- Right-eye quad (1:1 geometry) ---
  const geometry2 = new THREE.PlaneGeometry(1, 1);

  // Adjust the UVs so that this mesh only displays the *right* half of the video (0.5 → 1.0).
  const uvs2 = geometry2.attributes.uv.array;
  for (let i = 0; i < uvs2.length; i += 2) {
    // u coords
    uvs2[i] *= 0.5;   // 0 → 0.5
    uvs2[i] += 0.5;   // shift → 0.5 → 1.0
  }

  const material2 = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  mesh2 = new THREE.Mesh(geometry2, material2);
  // Right eye only
  mesh2.layers.set(2);
  scene.add(mesh2);

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  // If you really want 1:1 exact pixel size (no retina scaling), remove or change this line:
  renderer.setPixelRatio(window.devicePixelRatio);

  // For initial load, pick the smaller of the window’s width/height so it’s square
  const size = Math.min(window.innerWidth, window.innerHeight);
  renderer.setSize(size, size);

  // Enable WebXR
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');

  // Attach the canvas to #container
  container.appendChild(renderer.domElement);

  // Create/append the VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // Listen for window resizing
  window.addEventListener('resize', onWindowResize);

  // Animation loop
  renderer.setAnimationLoop(animate);
}

function onWindowResize() {
  // Force a square viewport on resize
  const size = Math.min(window.innerWidth, window.innerHeight);
  renderer.setSize(size, size);

  // Force camera’s aspect ratio to 1
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}

function animate() {
  // Position both quads ~3 meters in front of camera, facing the camera
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  const frontPosition = camera.position
    .clone()
    .add(cameraDirection.clone().multiplyScalar(3));

  mesh1.position.copy(frontPosition);
  mesh1.quaternion.copy(camera.quaternion); // Face the camera

  mesh2.position.copy(frontPosition);
  mesh2.quaternion.copy(camera.quaternion); // Face the camera

  // Render the scene
  renderer.render(scene, camera);
}