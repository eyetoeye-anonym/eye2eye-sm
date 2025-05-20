// stereo.js
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, mesh1, mesh2;

init();

function init() {
  const container = document.getElementById('container');

  // Grab the hidden <img>
  const imgElement = document.getElementById('stereoImage');

  // Create a texture from the <img> element
  const texture = new THREE.TextureLoader().load(imgElement.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101010);

  // Create the camera with forced aspect ratio = 1.0
  camera = new THREE.PerspectiveCamera(70, 1.0, 1, 2000);
  // Left eye → layer 1; right eye → layer 2
  camera.layers.enable(1);
  camera.layers.enable(2);

  // --- Left eye quad ---
  const geometry1 = new THREE.PlaneGeometry(2, 1);
  const uvs1 = geometry1.attributes.uv.array;
  for (let i = 0; i < uvs1.length; i += 2) {
    // scale U [0..1] to [0..0.5]
    uvs1[i] *= 0.5;
  }
  const material1 = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  mesh1 = new THREE.Mesh(geometry1, material1);
  mesh1.layers.set(1);
  scene.add(mesh1);

  // --- Right eye quad ---
  const geometry2 = new THREE.PlaneGeometry(2, 1);
  const uvs2 = geometry2.attributes.uv.array;
  for (let i = 0; i < uvs2.length; i += 2) {
    // scale U [0..1] → [0..0.5]
    uvs2[i] *= 0.5;
    // shift to [0.5..1.0]
    uvs2[i] += 0.5;
  }
  const material2 = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  mesh2 = new THREE.Mesh(geometry2, material2);
  mesh2.layers.set(2);
  scene.add(mesh2);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Force a 1:1 viewport
  setViewportSize();
  window.addEventListener('resize', onWindowResize);

  // XR
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');

  container.appendChild(renderer.domElement);

  // VR Button
  document.body.appendChild(VRButton.createButton(renderer));

  // Start loop
  renderer.setAnimationLoop(animate);
}

function onWindowResize() {
  setViewportSize();
}

function setViewportSize() {
  // We want width : height = 1 : 1
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;

  // Determine the largest square that fits in the browser window
  let w = maxW;
  let h = w;
  if (h > maxH) {
    h = maxH;
    w = h;
  }

  // Apply to renderer
  renderer.setSize(w, h);

  // Update camera aspect
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}

function animate() {
  // Position both quads 3m in front of the camera
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  const frontPosition = camera.position.clone().add(cameraDirection.multiplyScalar(3));

  mesh1.position.copy(frontPosition);
  mesh1.quaternion.copy(camera.quaternion);

  mesh2.position.copy(frontPosition);
  mesh2.quaternion.copy(camera.quaternion);

  renderer.render(scene, camera);
}
