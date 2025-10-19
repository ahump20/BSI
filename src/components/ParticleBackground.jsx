import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MOBILE_PARTICLE_COUNT = 5000
const DESKTOP_PARTICLE_COUNT = 15000
const BURN_ORANGE_PALETTE = [0xcc5500, 0xe76f51, 0xf4a261, 0xffb347]

function ParticleBackground() {
  const containerRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      1,
      1000
    )
    camera.position.z = 300

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const getParticleCount = () =>
      window.matchMedia('(max-width: 768px)').matches
        ? MOBILE_PARTICLE_COUNT
        : DESKTOP_PARTICLE_COUNT

    const buildParticles = (count) => {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const color = new THREE.Color()

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3
        positions[i3] = (Math.random() - 0.5) * 800
        positions[i3 + 1] = (Math.random() - 0.5) * 800
        positions[i3 + 2] = (Math.random() - 0.5) * 800

        color.setHex(BURN_ORANGE_PALETTE[i % BURN_ORANGE_PALETTE.length])
        colors[i3] = color.r
        colors[i3 + 1] = color.g
        colors[i3 + 2] = color.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: window.matchMedia('(max-width: 768px)').matches ? 1.2 : 1.5,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
      })

      const points = new THREE.Points(geometry, material)
      points.rotation.x = Math.random() * Math.PI
      points.rotation.y = Math.random() * Math.PI
      return points
    }

    let particleCount = getParticleCount()
    let particles = buildParticles(particleCount)
    scene.add(particles)

    const resizeRenderer = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()

      const nextCount = getParticleCount()
      if (nextCount !== particleCount) {
        scene.remove(particles)
        particles.geometry.dispose()
        particles.material.dispose()
        particleCount = nextCount
        particles = buildParticles(particleCount)
        scene.add(particles)
      }
    }

    const stopAnimation = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    const animate = () => {
      if (document.visibilityState !== 'visible') {
        stopAnimation()
        return
      }
      particles.rotation.y += 0.0008 * (particleCount / DESKTOP_PARTICLE_COUNT)
      particles.rotation.x += 0.0003 * (particleCount / DESKTOP_PARTICLE_COUNT)
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (animationFrameRef.current !== null) return
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startAnimation()
      } else {
        stopAnimation()
      }
    }

    window.addEventListener('resize', resizeRenderer)

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const mediaListener = () => resizeRenderer()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', mediaListener)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(mediaListener)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    resizeRenderer()
    if (document.visibilityState === 'visible') {
      startAnimation()
    }

    return () => {
      stopAnimation()
      window.removeEventListener('resize', resizeRenderer)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaListener)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(mediaListener)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      scene.remove(particles)
      particles.geometry.dispose()
      particles.material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="particle-background" aria-hidden="true" />
}

export default ParticleBackground
