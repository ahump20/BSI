import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MOBILE_PARTICLE_COUNT = 100000
const DESKTOP_PARTICLE_COUNT = 150000

const BURNT_ORANGE_PALETTE = [
  '#230901',
  '#4a1d04',
  '#8c3b00',
  '#bf5700',
  '#ff8c42'
]

function ParticleBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

    if (prefersReducedMotion) {
      return undefined
    }

    const isMobile = window.matchMedia
      ? window.matchMedia('(max-width: 768px)').matches
      : window.innerWidth <= 768
    const particleCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const colorChoices = BURNT_ORANGE_PALETTE.map((hex) => new THREE.Color(hex))

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 1600
      positions[i3 + 1] = (Math.random() - 0.5) * 1600
      positions[i3 + 2] = (Math.random() - 0.5) * 1600

      const shade = colorChoices[i % colorChoices.length]
      colors[i3] = shade.r
      colors[i3 + 1] = shade.g
      colors[i3 + 2] = shade.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: isMobile ? 1.2 : 1.6,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    let animationFrame
    let isAnimating = true

    const renderScene = () => {
      if (!isAnimating) {
        return
      }

      particles.rotation.y += 0.0007
      particles.rotation.x += 0.0003

      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(renderScene)
    }

    const startAnimation = () => {
      if (!isAnimating) {
        isAnimating = true
        animationFrame = requestAnimationFrame(renderScene)
      }
    }

    const stopAnimation = () => {
      if (isAnimating) {
        isAnimating = false
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
          animationFrame = undefined
        }
      }
    }

    animationFrame = requestAnimationFrame(renderScene)

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopAnimation()
      } else {
        startAnimation()
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopAnimation()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="particle-background" aria-hidden="true" />
}

export default ParticleBackground
