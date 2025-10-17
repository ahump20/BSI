import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MOBILE_PARTICLE_COUNT = 900
const DESKTOP_PARTICLE_COUNT = 1800
const BURNT_ORANGE_PALETTE = ['#BF5700', '#D97706', '#F97316', '#FFB347']

function ParticleBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    let renderer
    let scene
    let camera
    let points
    let geometry
    let material
    let animationFrameId
    let running = false
    let lastTimestamp = performance.now()

    const renderLoop = (timestamp) => {
      if (!running || !renderer || !scene || !camera || !points) {
        return
      }

      animationFrameId = requestAnimationFrame(renderLoop)

      const delta = Math.min(timestamp - lastTimestamp, 50)
      lastTimestamp = timestamp

      points.rotation.y += delta * 0.00035
      points.rotation.x += delta * 0.00015

      renderer.render(scene, camera)
    }

    const pause = () => {
      if (!running) {
        return
      }

      running = false

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }
    }

    const resume = () => {
      if (running || !renderer) {
        return
      }

      running = true
      lastTimestamp = performance.now()
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    const cleanupScene = () => {
      pause()

      if (renderer) {
        renderer.dispose()

        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement)
        }

        renderer = undefined
      }

      if (geometry) {
        geometry.dispose()
        geometry = undefined
      }

      if (material) {
        material.dispose()
        material = undefined
      }

      scene = undefined
      camera = undefined
      points = undefined
    }

    const handleResize = () => {
      if (!renderer || !camera) {
        return
      }

      const { innerWidth, innerHeight } = window
      renderer.setSize(innerWidth, innerHeight)
      camera.aspect = innerWidth / innerHeight
      camera.updateProjectionMatrix()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause()
      } else if (!mediaQuery.matches) {
        resume()
      }
    }

    const handleWindowBlur = () => pause()

    const handleWindowFocus = () => {
      if (!document.hidden && !mediaQuery.matches) {
        resume()
      }
    }

    const initScene = () => {
      cleanupScene()

      scene = new THREE.Scene()

      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        1000
      )
      camera.position.z = 220

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)

      const canvas = renderer.domElement
      canvas.style.position = 'fixed'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      canvas.style.zIndex = '-1'

      container.innerHTML = ''
      container.appendChild(canvas)

      const isMobile = window.innerWidth < 768
      const particleCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT

      geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const color = new THREE.Color()

      for (let i = 0; i < particleCount; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 600
        positions[i * 3 + 1] = (Math.random() - 0.5) * 600
        positions[i * 3 + 2] = (Math.random() - 0.5) * 600

        color.set(BURNT_ORANGE_PALETTE[i % BURNT_ORANGE_PALETTE.length])
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      material = new THREE.PointsMaterial({
        size: isMobile ? 1.4 : 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })

      points = new THREE.Points(geometry, material)
      points.rotation.set(0.2, 0.1, 0)
      scene.add(points)

      running = true
      lastTimestamp = performance.now()
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    const handleMotionPreferenceChange = (event) => {
      if (event.matches) {
        pause()
        cleanupScene()
        container.innerHTML = ''
        container.style.display = 'none'
      } else {
        container.style.display = ''
        initScene()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleResize)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    mediaQuery.addEventListener('change', handleMotionPreferenceChange)

    if (mediaQuery.matches) {
      container.style.display = 'none'
    } else {
      container.style.display = ''
      initScene()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
      cleanupScene()
    }
  }, [])

  return <div ref={containerRef} className="particle-background" aria-hidden="true" />
}

export default ParticleBackground
