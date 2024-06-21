import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';

import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

import { Sky } from 'three/addons/objects/Sky.js';
/**
 * Base
 */
// Debug

let gui;
if (window.location.hash === '#debug') gui = new GUI({ width: 340 });

const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// GLTF loader
const gltfLoader = new GLTFLoader();
// gltfLoader.setDRACOLoader(dracoLoader);

// Textures
const bakedTexture = textureLoader.load('baked-black.jpg');

bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

// Pole light
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

// Portal light
const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
  },
  transparent: true,
});

// model
const sceneMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

gltfLoader.load('baked-portal.glb', (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked');
  const poleLightMeshA = gltf.scene.children.find(
    (child) => child.name === 'rope008'
  );
  const poleLightMeshB = gltf.scene.children.find(
    (child) => child.name === 'base006'
  );
  const portalLightMesh = gltf.scene.children.find(
    (child) => child.name === 'Circle'
  );

  poleLightMeshA.material = poleLightMaterial;
  poleLightMeshB.material = poleLightMaterial;
  portalLightMesh.material = portalLightMaterial;
  bakedMesh.material = sceneMaterial;

  gltf.scene.position.y = -0.75;
  scene.add(gltf.scene);
});

// Geometries

const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);

const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scaleArray[i] = Math.random();
}
firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);
firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

// material
const firefliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
    uTime: { value: 0 },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight + 1,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight + 1;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.maxPolarAngle = Math.PI / 2 - 0.25;
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = '#201919';
renderer.setClearColor(debugObject.clearColor);

// GUI
if (gui) {
  gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
  });

  gui
    .add(firefliesMaterial.uniforms.uSize, 'value')
    .min(0)
    .max(500)
    .step(1)
    .name('firefliesSize');
}

// Add Sky
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

const skyParameters = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.1,
  mieDirectionalG: 0.95,
  elevation: -2.15,
  azimuth: -167.2,
  exposure: renderer.toneMappingExposure,
};

function updateSky() {
  const uniforms = sky.material.uniforms;
  uniforms['turbidity'].value = skyParameters.turbidity;
  uniforms['rayleigh'].value = skyParameters.rayleigh;
  uniforms['mieCoefficient'].value = skyParameters.mieCoefficient;
  uniforms['mieDirectionalG'].value = skyParameters.mieDirectionalG;

  const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
  const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  uniforms['sunPosition'].value.copy(sun);

  renderer.toneMappingExposure = skyParameters.exposure;
  renderer.render(scene, camera);
}
if (gui) {
  gui.add(skyParameters, 'turbidity', 0.0, 20.0, 0.1).onChange(updateSky);
  gui.add(skyParameters, 'rayleigh', 0.0, 4, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'mieDirectionalG', 0.0, 1, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'elevation', -5, 10, 0.01).onChange(updateSky);
  gui.add(skyParameters, 'azimuth', -180, 180, 0.1).onChange(updateSky);
  gui.add(skyParameters, 'exposure', 0, 1, 0.0001).onChange(updateSky);
}
updateSky();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Update materials
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalLightMaterial.uniforms.uTime.value = elapsedTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
