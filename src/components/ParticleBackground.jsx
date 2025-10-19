import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MOBILE_BREAKPOINT = 768
const MOBILE_PARTICLE_COUNT = 120
const DESKTOP_PARTICLE_COUNT = 260
const COLOR_PALETTE = ['#CC5500', '#FF8C42', '#FFB347', '#B7410E']

const ParticleBackground = () => {
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const currentCountRef = useRef(0)
  const isVisibleRef = useRef(true)
  const sceneRef = useRef(new THREE.Scene())
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(60, 1, 1, 1000)
  )
  const particlesRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = sceneRef.current
    const camera = cameraRef.current
    camera.position.z = 200

    const createParticles = (count) => {
      if (particlesRef.current) {
        scene.remove(particlesRef.current)
        particlesRef.current.geometry.dispose()
        particlesRef.current.material.dispose()
        particlesRef.current = null
      }

      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const color = new THREE.Color()

      for (let i = 0; i < count; i += 1) {
        const ix = i * 3
        positions[ix] = (Math.random() - 0.5) * 400
        positions[ix + 1] = (Math.random() - 0.5) * 400
        positions[ix + 2] = (Math.random() - 0.5) * 400

        color.set(COLOR_PALETTE[i % COLOR_PALETTE.length])
        colors[ix] = color.r
        colors[ix + 1] = color.g
        colors[ix + 2] = color.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: 2.2,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        depthWrite: false
      })

      const particles = new THREE.Points(geometry, material)
      particlesRef.current = particles
      scene.add(particles)
      currentCountRef.current = count
    }

    const getTargetCount = () =>
      window.innerWidth < MOBILE_BREAKPOINT
        ? MOBILE_PARTICLE_COUNT
        : DESKTOP_PARTICLE_COUNT

    const resizeRenderer = () => {
      const { clientWidth, clientHeight } = container
      if (clientWidth === 0 || clientHeight === 0) return

      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    const handleResize = () => {
      const targetCount = getTargetCount()
      if (targetCount !== currentCountRef.current) {
        createParticles(targetCount)
      }
      resizeRenderer()
    }

    const animate = () => {
      if (!isVisibleRef.current) {
        animationRef.current = null
        return
      }

      const delta = clockRef.current.getDelta()
      if (particlesRef.current) {
        particlesRef.current.rotation.y += delta * 0.08
        particlesRef.current.rotation.x += delta * 0.04
      }

      renderer.render(scene, camera)
      animationRef.current = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (!animationRef.current) {
        clockRef.current.start()
        animationRef.current = window.requestAnimationFrame(animate)
      }
    }

    const stopAnimation = () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'
      if (isVisibleRef.current) {
        startAnimation()
      } else {
        stopAnimation()
      }
    }

    createParticles(getTargetCount())
    resizeRenderer()
    startAnimation()

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopAnimation()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (particlesRef.current) {
        scene.remove(particlesRef.current)
        particlesRef.current.geometry.dispose()
        particlesRef.current.material.dispose()
        particlesRef.current = null
      }

      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="particle-background" aria-hidden="true" />
}

export default ParticleBackground
