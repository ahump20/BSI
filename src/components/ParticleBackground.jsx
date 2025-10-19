import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MOBILE_PARTICLE_COUNT = 70
const DESKTOP_PARTICLE_COUNT = 160
const PARTICLE_SPREAD = 220

const palette = ['#DC6026', '#F77F2F', '#FFB25C', '#7F5539']

function ParticleBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    let renderer = null
    let scene = null
    let camera = null
    let points = null
    let geometry = null
    let material = null
    let velocities = null
    let animationFrame = null
    let particleCount = 0

    const clock = new THREE.Clock()
    let isPaused = document.hidden

    const createParticles = (count, isMobile) => {
      geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      velocities = new Float32Array(count * 3)

      for (let i = 0; i < count; i += 1) {
        const idx = i * 3
        positions[idx] = THREE.MathUtils.randFloatSpread(PARTICLE_SPREAD)
        positions[idx + 1] = THREE.MathUtils.randFloatSpread(PARTICLE_SPREAD)
        positions[idx + 2] = THREE.MathUtils.randFloat(-80, 80)

        velocities[idx] = THREE.MathUtils.randFloatSpread(0.12)
        velocities[idx + 1] = THREE.MathUtils.randFloatSpread(0.12)
        velocities[idx + 2] = THREE.MathUtils.randFloat(-0.05, 0.05)

        const tone = new THREE.Color(palette[i % palette.length])
        colors[idx] = tone.r
        colors[idx + 1] = tone.g
        colors[idx + 2] = tone.b
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      material = new THREE.PointsMaterial({
        size: isMobile ? 1.6 : 2.4,
        transparent: true,
        opacity: 0.82,
        vertexColors: true,
        depthWrite: false,
        sizeAttenuation: true
      })

      points = new THREE.Points(geometry, material)
      scene.add(points)
    }

    const destroyScene = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }

      if (points && scene) {
        scene.remove(points)
      }

      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()

      if (renderer?.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }

      renderer = null
      scene = null
      camera = null
      points = null
      geometry = null
      material = null
      velocities = null
    }

    const tick = () => {
      if (!renderer || !scene || !camera || !geometry || !velocities) {
        return
      }

      if (!isPaused) {
        const delta = Math.min(clock.getDelta(), 0.04)
        const positions = geometry.attributes.position.array
        const len = particleCount * 3

        for (let idx = 0; idx < len; idx += 3) {
          positions[idx] += velocities[idx] * delta * 60
          positions[idx + 1] += velocities[idx + 1] * delta * 60
          positions[idx + 2] += velocities[idx + 2] * delta * 60

          if (positions[idx] > PARTICLE_SPREAD / 2 || positions[idx] < -PARTICLE_SPREAD / 2) {
            velocities[idx] *= -1
          }
          if (positions[idx + 1] > PARTICLE_SPREAD / 2 || positions[idx + 1] < -PARTICLE_SPREAD / 2) {
            velocities[idx + 1] *= -1
          }
          if (positions[idx + 2] > 100 || positions[idx + 2] < -120) {
            velocities[idx + 2] *= -1
          }
        }

        geometry.attributes.position.needsUpdate = true
        if (points) {
          points.rotation.z += 0.0006
        }

        renderer.render(scene, camera)
      } else {
        clock.getDelta()
      }

      animationFrame = requestAnimationFrame(tick)
    }

    const startScene = (count, isMobile) => {
      destroyScene()

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / Math.max(container.clientHeight, 1),
        1,
        1000
      )
      camera.position.z = isMobile ? 200 : 180

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.domElement.style.pointerEvents = 'none'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'

      container.appendChild(renderer.domElement)

      particleCount = count
      createParticles(count, isMobile)
      clock.getDelta()
      animationFrame = requestAnimationFrame(tick)
    }

    const handleResize = () => {
      if (!renderer || !camera || !container) {
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      renderer.setSize(width, height)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    const handleVisibility = () => {
      isPaused = document.hidden
      if (!isPaused) {
        clock.getDelta()
      }
    }

    const matchMedia = window.matchMedia('(max-width: 768px)')
    const initialMobile = matchMedia.matches
    startScene(initialMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT, initialMobile)
    handleResize()

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleResize)
      : null

    resizeObserver?.observe(container)

    const handleMediaChange = (event) => {
      const isMobile = event.matches
      const nextCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT
      if (nextCount === particleCount) {
        return
      }
      startScene(nextCount, isMobile)
      handleResize()
    }

    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleMediaChange)
    } else if (matchMedia.addListener) {
      matchMedia.addListener(handleMediaChange)
    }

    return () => {
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener('change', handleMediaChange)
      } else if (matchMedia.removeListener) {
        matchMedia.removeListener(handleMediaChange)
      }
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
      resizeObserver?.disconnect()
      destroyScene()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="particle-background"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  )
}

export default ParticleBackground
