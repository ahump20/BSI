import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './RealTimeFeedbackStudio.css'

const DEFAULT_TONE = {
  volumeDb: -Infinity,
  pitchHz: 0,
  steadiness: 0,
  mood: 'Idle'
}

const DEFAULT_BODY = {
  posture: 'Not tracked',
  energyScore: 0,
  movement: 'None',
  cues: []
}

const DEFAULT_FACE = {
  expression: 'Not tracked',
  smileScore: 0,
  engagement: 0,
  blinkRate: 0,
  eyeContact: 'Unknown'
}

const DEFAULT_DIALECT = {
  region: 'Unknown',
  confidence: 0,
  paceWpm: 0,
  transcript: ''
}

const SHOULDER_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee']
]

const DIALECT_RULES = [
  {
    region: 'Gulf South',
    keywords: ["y'all", "fixin'", 'howdy', "ain't"],
    bonus: 2
  },
  {
    region: 'Appalachia',
    keywords: ['reckon', 'holler', 'britches', "might could"],
    bonus: 1.5
  },
  {
    region: 'Midwest',
    keywords: ['ope', 'pop', 'you betcha', 'heck'],
    bonus: 1
  },
  {
    region: 'Northeast',
    keywords: ['wicked', 'pahk', 'ayuh'],
    bonus: 1
  },
  {
    region: 'West Coast',
    keywords: ['hella', 'gnarly', 'dude'],
    bonus: 0.5
  }
]

const formatDb = (value) => {
  if (!Number.isFinite(value)) return '–'
  return `${value.toFixed(1)} dB`
}

const formatHz = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '–'
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kHz`
  }
  return `${value.toFixed(0)} Hz`
}

const distance2D = (a, b) => {
  if (!a || !b) return 0
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

const distance3D = (a, b) => {
  if (!a || !b) return 0
  const dx = (a.x ?? 0) - (b.x ?? 0)
  const dy = (a.y ?? 0) - (b.y ?? 0)
  const dz = (a.z ?? 0) - (b.z ?? 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function RealTimeFeedbackStudio() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const poseDetectorRef = useRef(null)
  const faceDetectorRef = useRef(null)
  const toneLoopRef = useRef(0)
  const poseLoopRef = useRef(0)
  const blinkHistoryRef = useRef([])
  const toneHistoryRef = useRef([])
  const postureHistoryRef = useRef([])
  const speechRecognitionRef = useRef(null)
  const insightCooldownRef = useRef(new Map())

  const [sessionActive, setSessionActive] = useState(false)
  const [loadingModels, setLoadingModels] = useState(true)
  const [modelError, setModelError] = useState(null)
  const [toneFeedback, setToneFeedback] = useState(DEFAULT_TONE)
  const [bodyFeedback, setBodyFeedback] = useState(DEFAULT_BODY)
  const [faceFeedback, setFaceFeedback] = useState(DEFAULT_FACE)
  const [dialectFeedback, setDialectFeedback] = useState(DEFAULT_DIALECT)
  const [insights, setInsights] = useState([])
  const [permissionError, setPermissionError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)

  const addInsight = useCallback((message, category, cooldownMs = 15000) => {
    const key = `${category}:${message}`
    const now = Date.now()
    const lastFired = insightCooldownRef.current.get(key)
    if (lastFired && now - lastFired < cooldownMs) {
      return
    }
    insightCooldownRef.current.set(key, now)
    setInsights((prev) => {
      const next = [
        {
          id: `${key}-${now}`,
          message,
          category,
          timestamp: now
        },
        ...prev
      ]
      return next.slice(0, 10)
    })
  }, [])

  const stopSession = useCallback(() => {
    setSessionActive(false)
    if (poseLoopRef.current) {
      cancelAnimationFrame(poseLoopRef.current)
      poseLoopRef.current = 0
    }
    if (toneLoopRef.current) {
      cancelAnimationFrame(toneLoopRef.current)
      toneLoopRef.current = 0
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null
        speechRecognitionRef.current.onerror = null
        speechRecognitionRef.current.onend = null
        speechRecognitionRef.current.stop()
      } catch (err) {
        console.warn('Failed to stop speech recognition', err)
      }
      speechRecognitionRef.current = null
    }
    blinkHistoryRef.current = []
    toneHistoryRef.current = []
    postureHistoryRef.current = []
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setToneFeedback(DEFAULT_TONE)
    setBodyFeedback(DEFAULT_BODY)
    setFaceFeedback(DEFAULT_FACE)
    setDialectFeedback(DEFAULT_DIALECT)
  }, [])

  useEffect(() => {
    return () => {
      stopSession()
    }
  }, [stopSession])

  useEffect(() => {
    let cancelled = false
    const loadModels = async () => {
      try {
        const [tf, posedetection, faceLandmarksDetection] = await Promise.all([
          import('@tensorflow/tfjs-core'),
          import('@tensorflow-models/pose-detection'),
          import('@tensorflow-models/face-landmarks-detection')
        ])
        await Promise.all([
          import('@tensorflow/tfjs-converter'),
          import('@tensorflow/tfjs-backend-webgl')
        ])

        await tf.setBackend('webgl')
        await tf.ready()

        const poseDetector = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet,
          {
            modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true
          }
        )

        const faceDetector = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            maxFaces: 1,
            refineLandmarks: true
          }
        )

        if (cancelled) {
          poseDetector.dispose?.()
          faceDetector.dispose?.()
          return
        }

        poseDetectorRef.current = poseDetector
        faceDetectorRef.current = faceDetector
        setLoadingModels(false)
      } catch (err) {
        console.error('Failed to load ML models', err)
        if (!cancelled) {
          setModelError(err.message || 'Model initialization failed')
          setLoadingModels(false)
        }
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [])

  const analyzeTone = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.fftSize
    const data = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(data)

    let sumSquares = 0
    for (let i = 0; i < bufferLength; i += 1) {
      const value = data[i]
      sumSquares += value * value
    }

    const rms = Math.sqrt(sumSquares / bufferLength)
    const volumeDb = 20 * Math.log10(rms + 1e-8)

    const pitch = estimatePitch(data, analyser.context.sampleRate)

    const now = Date.now()
    toneHistoryRef.current.push({ time: now, volumeDb, pitch })
    while (toneHistoryRef.current.length > 240) {
      toneHistoryRef.current.shift()
    }

    const recent = toneHistoryRef.current.slice(-30)
    const pitchVariance = computeVariance(recent.map((entry) => entry.pitch || 0))
    const volumeVariance = computeVariance(recent.map((entry) => entry.volumeDb || -60))

    const steadiness = clamp(100 - (pitchVariance * 0.01 + volumeVariance * 0.5), 0, 100)

    let mood = 'Calm'
    if (volumeDb > -18 && pitch > 230) {
      mood = 'Energetic'
    } else if (volumeDb < -30 && pitch < 180) {
      mood = 'Soft'
    } else if (volumeDb > -15) {
      mood = 'Commanding'
    }

    setToneFeedback({
      volumeDb,
      pitchHz: pitch,
      steadiness,
      mood
    })

    if (volumeDb > -12) {
      addInsight('Projecting aggressively — consider softening for emphasis.', 'Tone')
    } else if (volumeDb < -32) {
      addInsight('Volume is low. Step closer to the mic or elevate projection.', 'Tone')
    }

    toneLoopRef.current = requestAnimationFrame(analyzeTone)
  }, [addInsight])

  const analyzePose = useCallback(async () => {
    if (!sessionActive) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const poseDetector = poseDetectorRef.current
    const faceDetector = faceDetectorRef.current

    if (!video || video.readyState < 2 || !poseDetector) {
      poseLoopRef.current = requestAnimationFrame(analyzePose)
      return
    }

    const poses = await poseDetector.estimatePoses(video, {
      flipHorizontal: true,
      maxPoses: 1
    })

    const pose = poses[0]
    if (pose) {
      drawPose(pose, video, canvas)
      const body = deriveBodyFeedback(pose)
      postureHistoryRef.current.push({ time: Date.now(), ...body })
      while (postureHistoryRef.current.length > 90) {
        postureHistoryRef.current.shift()
      }
      setBodyFeedback(body)

      if (body.posture === 'Leaning Forward') {
        addInsight('You are leaning forward — square up to keep presence balanced.', 'Body Language')
      }
      if (body.energyScore < 40) {
        addInsight('Body energy is reading flat. Use your hands to reinforce key beats.', 'Body Language')
      }
    }

    if (faceDetector && video) {
      try {
        const faces = await faceDetector.estimateFaces({
          input: video,
          returnTensors: false,
          flipHorizontal: true,
          predictIrises: true
        })
        if (faces?.length) {
          const face = deriveFaceFeedback(faces[0], blinkHistoryRef)
          setFaceFeedback(face)
          if (face.expression === 'Neutral' && face.smileScore < 1.3) {
            addInsight('Face looks flat. Add a soft smile to boost approachability.', 'Facial Expression')
          }
          if (face.eyeContact === 'Drifting') {
            addInsight('Eyes are drifting off camera — pull them back to the lens.', 'Facial Expression')
          }
        }
      } catch (err) {
        console.warn('Face estimation error', err)
      }
    }

    poseLoopRef.current = requestAnimationFrame(analyzePose)
  }, [addInsight, sessionActive])

  const startSession = useCallback(async () => {
    if (sessionActive) {
      stopSession()
      return
    }

    setPermissionError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.smoothingTimeConstant = 0.7
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      setSessionActive(true)
      toneLoopRef.current = requestAnimationFrame(analyzeTone)
      poseLoopRef.current = requestAnimationFrame(analyzePose)

      setupSpeechRecognition(setSpeechSupported, setDialectFeedback, addInsight, speechRecognitionRef)
    } catch (err) {
      console.error('Failed to start feedback session', err)
      setPermissionError(err.message || 'Unable to access camera/microphone')
      stopSession()
    }
  }, [addInsight, analyzePose, analyzeTone, sessionActive, stopSession])

  const sessionSummary = useMemo(() => {
    const postureEntries = postureHistoryRef.current
    const toneEntries = toneHistoryRef.current
    const lastPosture = postureEntries[postureEntries.length - 1]
    const lastTone = toneEntries[toneEntries.length - 1]
    const summary = []
    if (lastTone) {
      summary.push(`${lastTone.pitch ? `${Math.round(lastTone.pitch)} Hz` : '–'} tone`) 
    }
    if (lastPosture?.posture) {
      summary.push(lastPosture.posture.toLowerCase())
    }
    if (dialectFeedback.region !== 'Unknown') {
      summary.push(`${dialectFeedback.region} dialect hints`)
    }
    return summary.join(' • ')
  }, [dialectFeedback])

  return (
    <section className="feedback-studio">
      <div className="studio-header">
        <div>
          <h2>AI Delivery Studio</h2>
          <p className="studio-subtitle">Real-time coaching on tone, expression, posture, and dialect.</p>
          {sessionSummary && <p className="studio-flash">Live read: {sessionSummary || 'Idle'}</p>}
        </div>
        <button
          type="button"
          className={`session-toggle ${sessionActive ? 'stop' : 'start'}`}
          onClick={startSession}
          disabled={loadingModels || !!modelError}
        >
          {sessionActive ? 'Stop Session' : 'Start Session'}
        </button>
      </div>

      {loadingModels && (
        <div className="studio-alert loading">
          <span className="dot" /> Preparing on-device models…
        </div>
      )}
      {modelError && (
        <div className="studio-alert error">Model load failed: {modelError}</div>
      )}
      {permissionError && (
        <div className="studio-alert error">{permissionError}</div>
      )}
      {!speechSupported && (
        <div className="studio-alert warning">
          Dialect insights require Chrome or Edge desktop — speech recognition unavailable here.
        </div>
      )}

      <div className="studio-grid">
        <div className="studio-video">
          <div className={`video-shell ${sessionActive ? 'active' : ''}`}>
            <video ref={videoRef} playsInline muted className="preview" />
            <canvas ref={canvasRef} className="overlay" />
          </div>
          <div className="video-hints">
            <h3>Live Prompts</h3>
            <ul>
              <li>Keep eyes level with the camera. Use the gold frame as your boundary.</li>
              <li>Talk through a recruiting pitch or game recap for the cleanest signal.</li>
              <li>Tap “Stop Session” before closing the tab to release your camera.</li>
            </ul>
          </div>
        </div>

        <div className="studio-panels">
          <MetricCard
            title="Tone"
            status={toneFeedback.mood}
            highlight={formatDb(toneFeedback.volumeDb)}
            trend={formatHz(toneFeedback.pitchHz)}
            score={toneFeedback.steadiness}
            description="Pitch, presence, and steadiness detected from the raw waveform."
          >
            <ul>
              <li>Pitch: {formatHz(toneFeedback.pitchHz)}</li>
              <li>Steadiness: {Math.round(toneFeedback.steadiness)}%</li>
              <li>Energy: {toneFeedback.mood}</li>
            </ul>
          </MetricCard>

          <MetricCard
            title="Body Language"
            status={bodyFeedback.posture}
            highlight={`${Math.round(bodyFeedback.energyScore)} energy`}
            trend={bodyFeedback.movement}
            score={bodyFeedback.energyScore}
            description="Pose tracking across shoulders, hips, and hands."
          >
            <ul>
              {bodyFeedback.cues.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </MetricCard>

          <MetricCard
            title="Facial Expression"
            status={faceFeedback.expression}
            highlight={`${Math.round(faceFeedback.engagement)} engagement`}
            trend={`${Math.round(faceFeedback.blinkRate)} blinks/min`}
            score={faceFeedback.engagement}
            description="Facial mesh for smile intensity, blink rhythm, and eye contact."
          >
            <ul>
              <li>Smile score: {faceFeedback.smileScore.toFixed(2)}</li>
              <li>Eye contact: {faceFeedback.eyeContact}</li>
            </ul>
          </MetricCard>

          <MetricCard
            title="Dialect & Pace"
            status={dialectFeedback.region}
            highlight={`${Math.round(dialectFeedback.paceWpm)} WPM`}
            trend={`${Math.round(dialectFeedback.confidence * 100)}% confidence`}
            score={dialectFeedback.confidence * 100}
            description="Speech-to-text heuristics highlight dialect markers and cadence."
          >
            <p className="transcript-label">Live transcript</p>
            <p className="transcript-text">{dialectFeedback.transcript || 'Waiting for speech…'}</p>
          </MetricCard>
        </div>
      </div>

      <aside className="studio-insights">
        <h3>Live Insights</h3>
        {insights.length === 0 && <p className="empty">No insights yet. Start speaking to populate live notes.</p>}
        <ul>
          {insights.map((entry) => (
            <li key={entry.id} className={`insight ${entry.category.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="insight-category">{entry.category}</span>
              <span className="insight-message">{entry.message}</span>
              <time>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  )
}

function MetricCard({ title, status, highlight, trend, score, description, children }) {
  return (
    <article className="metric-card">
      <header>
        <div>
          <h3>{title}</h3>
          <p className="metric-description">{description}</p>
        </div>
        <div className="metric-score" aria-label={`${title} score`}>{Number.isFinite(score) ? Math.round(score) : '–'}</div>
      </header>
      <div className="metric-body">
        <div className="metric-line">
          <span className="label">Status</span>
          <span className="value">{status}</span>
        </div>
        <div className="metric-line">
          <span className="label">Highlight</span>
          <span className="value">{highlight}</span>
        </div>
        <div className="metric-line">
          <span className="label">Trend</span>
          <span className="value">{trend}</span>
        </div>
      </div>
      <div className="metric-detail">{children}</div>
    </article>
  )
}

function deriveBodyFeedback(pose) {
  const keypoints = pose?.keypoints || []
  const lookup = new Map()
  keypoints.forEach((point) => {
    if (point.name && point.score > 0.35) {
      lookup.set(point.name, point)
    }
  })

  const leftShoulder = lookup.get('left_shoulder')
  const rightShoulder = lookup.get('right_shoulder')
  const leftHip = lookup.get('left_hip')
  const rightHip = lookup.get('right_hip')
  const leftWrist = lookup.get('left_wrist')
  const rightWrist = lookup.get('right_wrist')

  let posture = 'Centered'
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2
    const hipAvgY = (leftHip.y + rightHip.y) / 2
    const torsoAngle = (Math.atan2(shoulderAvgY - hipAvgY, leftShoulder.x - rightShoulder.x) * 180) / Math.PI
    const leanForward = shoulderAvgY < hipAvgY - 0.05
    const leanBackward = shoulderAvgY > hipAvgY + 0.05
    const tilt = Math.abs(torsoAngle)
    if (leanForward) {
      posture = 'Leaning Forward'
    } else if (leanBackward) {
      posture = 'Leaning Back'
    } else if (tilt > 12) {
      posture = 'Side Tilt'
    } else {
      posture = 'Balanced'
    }
  }

  const cues = []
  if (leftWrist && leftShoulder && leftWrist.y < leftShoulder.y) {
    cues.push('Left hand punctuating points')
  }
  if (rightWrist && rightShoulder && rightWrist.y < rightShoulder.y) {
    cues.push('Right hand punctuating points')
  }
  if (cues.length === 0) {
    cues.push('Hands resting')
  }

  let movement = 'Stable'
  if (leftWrist && rightWrist) {
    const horizontalTravel = Math.abs(leftWrist.x - rightWrist.x)
    if (horizontalTravel > 0.35) {
      movement = 'Expansive gestures'
    } else if (horizontalTravel > 0.18) {
      movement = 'Active hands'
    }
  }

  const energyScore = computeBodyEnergy(lookup)

  return {
    posture,
    energyScore,
    movement,
    cues
  }
}

function computeBodyEnergy(lookup) {
  const leftWrist = lookup.get('left_wrist')
  const rightWrist = lookup.get('right_wrist')
  const leftElbow = lookup.get('left_elbow')
  const rightElbow = lookup.get('right_elbow')
  const wrists = [leftWrist, rightWrist].filter(Boolean)
  const elbows = [leftElbow, rightElbow].filter(Boolean)
  let energy = 35
  wrists.forEach((wrist) => {
    const shoulder = lookup.get(wrist.name.startsWith('left') ? 'left_shoulder' : 'right_shoulder')
    if (shoulder) {
      const vertical = shoulder.y - wrist.y
      if (vertical > 0.12) energy += 20
    }
  })
  elbows.forEach((elbow) => {
    const shoulder = lookup.get(elbow.name.startsWith('left') ? 'left_shoulder' : 'right_shoulder')
    if (shoulder) {
      const distance = distance2D(elbow, shoulder)
      energy += distance * 40
    }
  })
  return clamp(energy, 5, 100)
}

function drawPose(pose, video, canvas) {
  if (!canvas || !video) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.lineWidth = 3
  ctx.strokeStyle = '#FBBF24'
  ctx.fillStyle = '#FBBF24'

  const keypoints = pose.keypoints || []
  const lookup = new Map()
  keypoints.forEach((point) => {
    if (point.score > 0.4) {
      lookup.set(point.name, point)
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  SHOULDER_CONNECTIONS.forEach(([aName, bName]) => {
    const a = lookup.get(aName)
    const b = lookup.get(bName)
    if (a && b) {
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  })
}

function deriveFaceFeedback(face, blinkHistoryRef) {
  const { keypoints } = face
  if (!keypoints?.length) {
    return DEFAULT_FACE
  }

  const lookup = new Map()
  keypoints.forEach((point, idx) => {
    lookup.set(idx, point)
  })

  const leftMouth = lookup.get(61)
  const rightMouth = lookup.get(291)
  const upperLip = lookup.get(13)
  const lowerLip = lookup.get(14)
  const leftEyeTop = lookup.get(159)
  const leftEyeBottom = lookup.get(145)
  const rightEyeTop = lookup.get(386)
  const rightEyeBottom = lookup.get(374)
  const leftEyeCorner = lookup.get(33)
  const leftEyeCornerOuter = lookup.get(133)
  const rightEyeCorner = lookup.get(362)
  const rightEyeCornerOuter = lookup.get(263)
  const noseTip = lookup.get(1)
  const forehead = lookup.get(10)

  const mouthWidth = distance3D(leftMouth, rightMouth)
  const mouthHeight = distance3D(upperLip, lowerLip)
  const smileScore = mouthHeight > 0 ? clamp(mouthWidth / mouthHeight, 0, 3) : 0

  const leftEyeOpen = distance3D(leftEyeTop, leftEyeBottom) / distance3D(leftEyeCorner, leftEyeCornerOuter)
  const rightEyeOpen = distance3D(rightEyeTop, rightEyeBottom) / distance3D(rightEyeCorner, rightEyeCornerOuter)
  const eyeOpenness = (leftEyeOpen + rightEyeOpen) / 2

  const now = Date.now()
  const blinked = eyeOpenness < 0.18
  const history = blinkHistoryRef.current
  const last = history[history.length - 1]
  if (!last || now - last.time > 120) {
    history.push({ time: now, blinked })
  } else {
    last.blinked = blinked || last.blinked
  }
  while (history.length > 240) history.shift()
  const minuteAgo = now - 60000
  const blinkRate = history.filter((entry) => entry.time >= minuteAgo && entry.blinked).length

  let expression = 'Neutral'
  if (smileScore > 1.6) {
    expression = 'Smiling'
  } else if (smileScore < 1.15 && eyeOpenness < 0.18) {
    expression = 'Fatigued'
  }

  let eyeContact = 'Engaged'
  if (noseTip && forehead) {
    const tilt = Math.abs(noseTip.x - forehead.x)
    if (tilt > 0.06) {
      eyeContact = 'Drifting'
    }
  }

  const engagement = clamp((smileScore - 1) * 40 + eyeOpenness * 200, 0, 100)

  return {
    expression,
    smileScore,
    engagement,
    blinkRate,
    eyeContact
  }
}

function computeVariance(values) {
  if (!values.length) return 0
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  return variance
}

function setupSpeechRecognition(setSpeechSupported, setDialectFeedback, addInsight, recognitionRef) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    setSpeechSupported(false)
    return
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  const transcriptQueue = []
  const paceWindow = []

  recognition.onresult = (event) => {
    let finalText = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const text = result[0].transcript.trim()
      if (result.isFinal) {
        finalText += `${text} `
        paceWindow.push({ time: Date.now(), words: text.split(/\s+/).length })
      }
    }

    if (finalText) {
      transcriptQueue.push(finalText)
      while (transcriptQueue.join(' ').length > 480) {
        transcriptQueue.shift()
      }
      while (paceWindow.length && Date.now() - paceWindow[0].time > 60000) {
        paceWindow.shift()
      }

      const totalWords = paceWindow.reduce((sum, chunk) => sum + chunk.words, 0)
      const minutes = Math.max((Date.now() - (paceWindow[0]?.time ?? Date.now())) / 60000, 1 / 60)
      const pace = totalWords / minutes

      const transcript = transcriptQueue.join(' ').trim()
      const dialect = detectDialect(transcript)
      setDialectFeedback({
        region: dialect.region,
        confidence: dialect.confidence,
        paceWpm: clamp(pace, 60, 220),
        transcript
      })

      if (pace > 180) {
        addInsight('Slow your delivery — pace spiked past broadcast tempo.', 'Dialect')
      } else if (pace < 90) {
        addInsight('Pick up the pace — cadence is drifting below 90 WPM.', 'Dialect')
      }
      if (dialect.region !== 'Unknown' && dialect.confidence > 0.45) {
        addInsight(`Distinct ${dialect.region} dialect markers detected.`, 'Dialect')
      }
    }
  }

  recognition.onerror = (event) => {
    console.warn('Speech recognition error', event.error)
  }

  recognition.onend = () => {
    try {
      recognition.start()
    } catch (err) {
      console.warn('Speech recognition restart failed', err)
    }
  }

  recognition.start()
  recognitionRef.current = recognition
}

function detectDialect(transcript) {
  const normalized = transcript.toLowerCase()
  const scores = DIALECT_RULES.map((rule) => {
    let score = 0
    rule.keywords.forEach((keyword) => {
      if (normalized.includes(keyword)) {
        score += rule.bonus
      }
    })
    return {
      region: rule.region,
      score
    }
  })

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  if (!best || best.score === 0) {
    return { region: 'Unknown', confidence: 0 }
  }
  const total = scores.reduce((sum, entry) => sum + entry.score, 0) || 1
  return {
    region: best.region,
    confidence: clamp(best.score / total, 0, 1)
  }
}

function estimatePitch(buffer, sampleRate) {
  const SIZE = buffer.length
  const MAX_SAMPLES = Math.floor(SIZE / 2)
  let bestOffset = -1
  let bestCorrelation = 0
  let rms = 0
  for (let i = 0; i < SIZE; i += 1) {
    const val = buffer[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) {
    return 0
  }
  let lastCorrelation = 1
  for (let offset = 2; offset <= MAX_SAMPLES; offset += 1) {
    let correlation = 0
    for (let i = 0; i < MAX_SAMPLES; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset])
    }
    correlation = 1 - correlation / MAX_SAMPLES
    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    } else if (bestCorrelation > 0.9 && correlation < lastCorrelation) {
      break
    }
    lastCorrelation = correlation
  }
  if (bestCorrelation > 0.01 && bestOffset !== -1) {
    return sampleRate / bestOffset
  }
  return 0
}

export default RealTimeFeedbackStudio
