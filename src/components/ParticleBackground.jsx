import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const BURNT_ORANGE_PALETTE = ['#cc5500', '#d97706', '#fb923c', '#7c2d12']

const getParticleCount = (width) => {
  if (width < 480) return 120
  if (width < 768) return 180
  if (width < 1024) return 260
  return 360
}

const generateAttributes = (count) => {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 400
    positions[i3 + 1] = (Math.random() - 0.5) * 200
    positions[i3 + 2] = (Math.random() - 0.5) * 400

    color.set(BURNT_ORANGE_PALETTE[i % BURNT_ORANGE_PALETTE.length])
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  return { positions, colors }
}

function ParticleBackground() {
  const containerRef = useRef(null)
  const frameRef = useRef()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const container = containerRef.current
    if (!container) {
      return undefined
    }

    let isPaused = document.hidden
    let lastTimestamp = performance.now()

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 120

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'

    container.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    let particleCount = getParticleCount(window.innerWidth)
    let { positions, colors } = generateAttributes(particleCount)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 2.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    const updateGeometry = (count) => {
      const attrs = generateAttributes(count)
      geometry.setAttribute('position', new THREE.BufferAttribute(attrs.positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(attrs.colors, 3))
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      geometry.computeBoundingSphere()
    }

    const handleResize = () => {
      if (!container) return

      const { clientWidth, clientHeight } = container
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)

      const nextCount = getParticleCount(window.innerWidth)
      if (nextCount !== particleCount) {
        particleCount = nextCount
        updateGeometry(particleCount)
      }
    }

    const animate = (timestamp) => {
      if (isPaused) {
        frameRef.current = undefined
        lastTimestamp = timestamp || performance.now()
        return
      }

      const deltaSeconds = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      particles.rotation.y += deltaSeconds * 0.08
      particles.rotation.x += deltaSeconds * 0.02

      renderer.render(scene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      isPaused = document.hidden

      if (isPaused && frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = undefined
      } else if (!isPaused && !frameRef.current) {
        lastTimestamp = performance.now()
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    frameRef.current = requestAnimationFrame(animate)

    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = undefined
      }

      geometry.dispose()
      material.dispose()
      renderer.dispose()

      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="particle-background"
      aria-hidden="true"
    />
  )
}

export default ParticleBackground

