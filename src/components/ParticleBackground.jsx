import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ParticleBackground = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.position = 'fixed'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.zIndex = '0'
    renderer.domElement.style.pointerEvents = 'none'

    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 8

    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 5000 : 15000

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const palette = ['#BF5700', '#CC6600', '#D97B38', '#E69551']

    for (let i = 0; i < particleCount; i += 1) {
      const index = i * 3
      positions[index] = (Math.random() - 0.5) * 40
      positions[index + 1] = (Math.random() - 0.5) * 30
      positions[index + 2] = (Math.random() - 0.5) * 35

      const color = new THREE.Color(palette[i % palette.length])
      colors[index] = color.r
      colors[index + 1] = color.g
      colors[index + 2] = color.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.05 : 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    let animationFrameId = null
    let isVisible = document.visibilityState === 'visible'

    const renderScene = () => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      particles.rotation.y += 0.0006
      particles.rotation.x += 0.0002

      const positionAttribute = geometry.getAttribute('position')
      for (let i = 0; i < positionAttribute.count; i += 1) {
        const y = positionAttribute.getY(i) + 0.0025
        positionAttribute.setY(i, y > 16 ? -16 : y)
      }
      positionAttribute.needsUpdate = true

      renderer.render(scene, camera)
      animationFrameId = window.requestAnimationFrame(renderScene)
    }

    const startAnimation = () => {
      if (!animationFrameId) {
        animationFrameId = window.requestAnimationFrame(renderScene)
      }
    }

    const stopAnimation = () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible'
      if (isVisible) {
        startAnimation()
      } else {
        stopAnimation()
      }
    }

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleResize)

    startAnimation()

    return () => {
      stopAnimation()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div className="particle-background" ref={containerRef} aria-hidden="true" />
}

export default ParticleBackground
