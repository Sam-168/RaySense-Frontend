<template>
  <div class="home">

    <!-- LOADING SCREEN -->
    <div id="loading" :class="{ done: loaded }">
      <div class="loading-text">INITIALIZING RAYSENSE</div>
      <div class="bar"></div>
    </div>

    <!-- THREE.JS CANVAS -->
    <div ref="canvasContainer" class="canvas-layer"></div>

    <!-- UI OVERLAY -->
    <div class="ui-layer">

      <!-- TOP BAR -->
      <header class="topbar">
        <div class="brand">
          <div class="dot"></div>
          <span>RaySense</span>
        </div>

        <div class="status">
          Biometric Attendance System
        </div>
      </header>

      <!-- CENTER HERO -->
      <main class="hero">

        <h1 class="title">Secure. Fast. Intelligent.</h1>
        <p class="subtitle">
          AI-powered facial attendance verification system
        </p>

        <div class="actions">

          <router-link to="/login" class="btn-primary">
            Login
          </router-link>

          <router-link to="/register" class="btn-secondary">
            Register
          </router-link>

        </div>

      </main>

      <!-- FOOTER -->
      <footer class="footer">
        <span>RaySense v1.0 • Secure Biometric Layer Active</span>
      </footer>

    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as THREE from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { useRouter } from 'vue-router'

const router = useRouter()
const canvasContainer = ref(null)
const loaded = ref(false)

let scene, camera, renderer, composer, clock, cubeCamera

onMounted(() => {
  init()
})

function init() {
  clock = new THREE.Clock()

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x08080c)

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  canvasContainer.value.appendChild(renderer.domElement)

  // LIGHTS
  scene.add(new THREE.AmbientLight(0x0a1428, 0.5))

  const light = new THREE.DirectionalLight(0x64c8ff, 1.5)
  light.position.set(3, 3, 4)
  scene.add(light)

  // ENV MAP
  const cubeRT = new THREE.WebGLCubeRenderTarget(128)
  cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRT)
  scene.add(cubeCamera)

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf6ff,
    transmission: 0.9,
    roughness: 0.1,
    thickness: 0.5,
    envMap: cubeRT.texture
  })

  const group = new THREE.Group()

  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 0.4), glassMat)
  stem.position.x = -0.5
  group.add(stem)

  const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.4), glassMat)
  top.position.set(0, 0.85, 0)
  group.add(top)

  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.4), glassMat)
  leg.rotation.z = 0.5
  leg.position.set(0.5, -0.6, 0)
  group.add(leg)

  scene.add(group)

  // PARTICLES
  const geo = new THREE.BufferGeometry()
  const count = 300
  const pos = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 6
    pos[i * 3 + 1] = (Math.random() - 0.5) * 6
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00dcff,
    transparent: true,
    opacity: 0.7
  })

  const particles = new THREE.Points(geo, mat)
  scene.add(particles)

  // POST PROCESSING
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,
      0.6,
      0.8
    )
  )

  window.addEventListener('resize', onResize)

  setTimeout(() => {
    loaded.value = true
  }, 2500)

  animate()
}

function animate() {
  requestAnimationFrame(animate)

  const t = clock.getElapsedTime()
  scene.rotation.y = t * 0.2

  scene.visible = false
  cubeCamera.update(renderer, scene)
  scene.visible = true

  composer.render()
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}
</script>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #08080c;
}

/* CANVAS */
.canvas-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* UI OVERLAY */
.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  pointer-events: none;
}

/* TOPBAR */
.topbar {
  display: flex;
  justify-content: space-between;
  padding: 18px 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.dot {
  width: 10px;
  height: 10px;
  background: #00dcff;
  border-radius: 50%;
  box-shadow: 0 0 12px #00dcff;
}

.status {
  font-size: 12px;
  color: #9ca3af;
}

/* HERO */
.hero {
  text-align: center;
  margin-top: -60px;
}

.title {
  font-size: 38px;
  font-weight: 700;
  background: linear-gradient(90deg, #00dcff, #ffffff);
  -webkit-background-clip: text;
  color: transparent;
}

.subtitle {
  margin-top: 10px;
  color: #9ca3af;
  font-size: 14px;
}

/* ACTIONS */
.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
  pointer-events: auto;
}

/* BUTTONS */
.btn-primary {
  padding: 12px 22px;
  background: rgba(0, 220, 255, 0.1);
  border: 1px solid rgba(0, 220, 255, 0.4);
  color: #00dcff;
  border-radius: 10px;
  text-decoration: none;
  transition: 0.2s;
}

.btn-primary:hover {
  background: rgba(0, 220, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 220, 255, 0.3);
}

.btn-secondary {
  padding: 12px 22px;
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  border-radius: 10px;
  text-decoration: none;
}

.btn-secondary:hover {
  border-color: #00dcff;
  color: #00dcff;
}

/* FOOTER */
.footer {
  text-align: center;
  font-size: 11px;
  color: #6b7280;
  padding: 20px;
}

/* LOADING */
#loading {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #0a0f1f, #08080c);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.8s ease;
}

#loading.done {
  opacity: 0;
  pointer-events: none;
}

.loading-text {
  color: #00dcff;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.bar {
  width: 220px;
  height: 3px;
  background: rgba(0,220,255,0.1);
  overflow: hidden;
}

.bar::before {
  content: '';
  display: block;
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, #00dcff, transparent);
  animation: scan 1.2s infinite;
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>