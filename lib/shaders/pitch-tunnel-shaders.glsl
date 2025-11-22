/**
 * BLAZE SPORTS INTEL - CUSTOM SHADERS FOR PITCH TUNNEL SIMULATOR
 * Advanced GLSL shaders for photorealistic baseball visualization
 *
 * Includes:
 * - Trajectory tube gradient shader
 * - Spin visualization particle system
 * - Tunnel zone heatmap shader
 * - Baseball leather detail shader
 * - Motion trail shader
 *
 * @version 1.0.0
 */

// ============================================================================
// TRAJECTORY TUBE GRADIENT SHADER
// Creates velocity-based color gradient along pitch path
// ============================================================================

#ifdef TRAJECTORY_VERTEX_SHADER

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;

// Varyings
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;
varying vec4 vColor;
varying float vDistanceFromCamera;

void main() {
    vec4 worldPos = world * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
    vUV = uv;
    vColor = color;
    vDistanceFromCamera = length(cameraPosition - worldPos.xyz);

    gl_Position = worldViewProjection * vec4(position, 1.0);
}

#endif

#ifdef TRAJECTORY_FRAGMENT_SHADER

precision highp float;

// Varyings
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;
varying vec4 vColor;
varying float vDistanceFromCamera;

// Uniforms
uniform vec3 cameraPosition;
uniform float time;

void main() {
    // Fresnel effect for edge glow
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormalW)), 2.0);

    // Pulsing animation
    float pulse = 0.5 + 0.5 * sin(time * 3.0);

    // Combine velocity color with fresnel glow
    vec3 baseColor = vColor.rgb;
    vec3 glowColor = baseColor * (1.0 + fresnel * 0.5 * pulse);

    // Distance fade for depth perception
    float distanceFade = smoothstep(50.0, 10.0, vDistanceFromCamera);

    // Final color with alpha
    gl_FragColor = vec4(glowColor, vColor.a * distanceFade);
}

#endif

// ============================================================================
// SPIN VISUALIZATION PARTICLE SHADER
// GPU particle system showing spin rate and axis
// ============================================================================

#ifdef SPIN_PARTICLE_VERTEX_SHADER

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 velocity;
attribute float age;
attribute float lifeTime;

// Uniforms
uniform mat4 view;
uniform mat4 projection;
uniform vec3 baseballPosition;
uniform vec3 spinAxis;
uniform float spinRate;
uniform float time;

// Varyings
varying float vAge;
varying float vLifeTime;
varying vec3 vColor;

void main() {
    // Calculate particle position around baseball based on spin
    float spinAngle = spinRate * 0.1 * age;
    mat3 spinRotation = mat3(
        cos(spinAngle), -sin(spinAngle), 0.0,
        sin(spinAngle), cos(spinAngle), 0.0,
        0.0, 0.0, 1.0
    );

    vec3 rotatedPos = spinRotation * position;
    vec3 worldPos = baseballPosition + rotatedPos;

    // Color based on spin axis
    vColor = vec3(0.0, 0.8, 1.0) + spinAxis * 0.2;

    vAge = age;
    vLifeTime = lifeTime;

    vec4 mvPosition = view * vec4(worldPos, 1.0);
    gl_Position = projection * mvPosition;

    // Size attenuation
    gl_PointSize = 5.0 * (1.0 - age / lifeTime) / length(mvPosition.xyz);
}

#endif

#ifdef SPIN_PARTICLE_FRAGMENT_SHADER

precision highp float;

varying float vAge;
varying float vLifeTime;
varying vec3 vColor;

void main() {
    // Circular particle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Fade out over lifetime
    float alpha = 1.0 - (vAge / vLifeTime);
    alpha *= smoothstep(0.5, 0.0, dist);

    gl_FragColor = vec4(vColor, alpha);
}

#endif

// ============================================================================
// TUNNEL ZONE HEATMAP SHADER
// Visualizes pitch overlap and divergence zones
// ============================================================================

#ifdef TUNNEL_HEATMAP_VERTEX_SHADER

precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;
uniform mat4 world;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

void main() {
    vec4 worldPos = world * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
    vUV = uv;

    gl_Position = worldViewProjection * vec4(position, 1.0);
}

#endif

#ifdef TUNNEL_HEATMAP_FRAGMENT_SHADER

precision highp float;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

uniform vec3 pitch1Trajectory[100];
uniform vec3 pitch2Trajectory[100];
uniform int trajectoryLength;
uniform float tunnelThreshold;

// Heatmap color gradient: blue (low overlap) -> red (high overlap)
vec3 heatmapColor(float intensity) {
    vec3 cold = vec3(0.0, 0.0, 1.0);    // Blue
    vec3 medium = vec3(0.0, 1.0, 0.0);  // Green
    vec3 hot = vec3(1.0, 1.0, 0.0);     // Yellow
    vec3 veryHot = vec3(1.0, 0.0, 0.0); // Red

    if (intensity < 0.33) {
        return mix(cold, medium, intensity * 3.0);
    } else if (intensity < 0.66) {
        return mix(medium, hot, (intensity - 0.33) * 3.0);
    } else {
        return mix(hot, veryHot, (intensity - 0.66) * 3.0);
    }
}

void main() {
    // Calculate minimum distance to both pitch trajectories
    float minDist1 = 1000.0;
    float minDist2 = 1000.0;

    for (int i = 0; i < 100; i++) {
        if (i >= trajectoryLength) break;

        float dist1 = distance(vPositionW, pitch1Trajectory[i]);
        float dist2 = distance(vPositionW, pitch2Trajectory[i]);

        minDist1 = min(minDist1, dist1);
        minDist2 = min(minDist2, dist2);
    }

    // Calculate tunnel effectiveness (both pitches close together)
    float tunnelScore = 1.0 - smoothstep(0.0, tunnelThreshold, minDist1 + minDist2);

    // Heatmap visualization
    vec3 color = heatmapColor(tunnelScore);
    float alpha = tunnelScore * 0.6;

    // Fresnel rim lighting
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormalW)), 3.0);
    color += vec3(1.0) * fresnel * 0.3;

    gl_FragColor = vec4(color, alpha);
}

#endif

// ============================================================================
// BASEBALL LEATHER DETAIL SHADER
// Procedural leather texture with stitching
// ============================================================================

#ifdef BASEBALL_DETAIL_VERTEX_SHADER

precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 tangent;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec2 vUV;

void main() {
    vec4 worldPos = world * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
    vTangentW = normalize((world * vec4(tangent, 0.0)).xyz);
    vUV = uv;

    gl_Position = worldViewProjection * vec4(position, 1.0);
}

#endif

#ifdef BASEBALL_DETAIL_FRAGMENT_SHADER

precision highp float;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec2 vUV;

uniform vec3 cameraPosition;
uniform samplerCube environmentTexture;
uniform float time;

// Simplex noise for leather grain
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Stitching pattern
float stitching(vec2 uv) {
    vec2 stitchUV = uv * 16.0;
    float seam1 = smoothstep(0.45, 0.55, abs(sin(stitchUV.x * 3.14159)));
    float seam2 = smoothstep(0.45, 0.55, abs(sin(stitchUV.y * 3.14159 * 0.5 + 0.5)));

    // Stitch detail
    float stitch = seam1 * seam2;
    float stitchDetail = smoothstep(0.48, 0.52, fract(stitchUV.x * 20.0)) *
                         smoothstep(0.48, 0.52, fract(stitchUV.y * 10.0));

    return stitch * (1.0 + stitchDetail * 0.5);
}

void main() {
    // Leather base color
    vec3 leatherColor = vec3(0.95, 0.93, 0.88);

    // Leather grain using noise
    float grain = snoise(vPositionW * 50.0) * 0.5 + 0.5;
    leatherColor *= 0.9 + grain * 0.2;

    // Red stitching
    float stitches = stitching(vUV);
    vec3 stitchColor = vec3(0.8, 0.1, 0.1);
    vec3 finalColor = mix(leatherColor, stitchColor, stitches * 0.7);

    // PBR lighting
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 normalW = normalize(vNormalW);

    // Fresnel for leather sheen
    float fresnel = pow(1.0 - max(dot(viewDir, normalW), 0.0), 5.0);

    // Environment reflection (subtle on leather)
    vec3 reflectDir = reflect(-viewDir, normalW);
    vec3 envColor = textureCube(environmentTexture, reflectDir).rgb;

    finalColor += envColor * (fresnel * 0.1 + 0.05);

    // Specular highlights
    vec3 lightDir = normalize(vec3(1.0, 2.0, -1.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normalW, halfDir), 0.0), 32.0);
    finalColor += vec3(1.0) * spec * 0.2;

    gl_FragColor = vec4(finalColor, 1.0);
}

#endif

// ============================================================================
// MOTION TRAIL SHADER
// Creates velocity-based motion blur effect
// ============================================================================

#ifdef MOTION_TRAIL_VERTEX_SHADER

precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute float trailProgress;

uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 velocity;

varying float vTrailProgress;
varying vec3 vPositionW;

void main() {
    // Stretch geometry along velocity direction
    vec3 offset = velocity * trailProgress * 0.1;
    vec3 stretchedPos = position - offset;

    vTrailProgress = trailProgress;
    vPositionW = (world * vec4(stretchedPos, 1.0)).xyz;

    gl_Position = worldViewProjection * vec4(stretchedPos, 1.0);
}

#endif

#ifdef MOTION_TRAIL_FRAGMENT_SHADER

precision highp float;

varying float vTrailProgress;
varying vec3 vPositionW;

uniform vec3 baseColor;
uniform float intensity;

void main() {
    // Fade trail based on progress
    float alpha = (1.0 - vTrailProgress) * intensity;

    // Color shift toward blue at high speeds
    vec3 color = mix(baseColor, vec3(0.5, 0.7, 1.0), vTrailProgress * 0.3);

    gl_FragColor = vec4(color, alpha);
}

#endif

// ============================================================================
// BREAK VECTOR ARROW SHADER
// Visualizes Magnus force direction
// ============================================================================

#ifdef BREAK_VECTOR_VERTEX_SHADER

precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 breakDirection;
uniform float breakMagnitude;

varying vec3 vNormalW;
varying float vIntensity;

void main() {
    vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
    vIntensity = breakMagnitude / 20.0; // Normalize to 20 inches max

    gl_Position = worldViewProjection * vec4(position, 1.0);
}

#endif

#ifdef BREAK_VECTOR_FRAGMENT_SHADER

precision highp float;

varying vec3 vNormalW;
varying float vIntensity;

uniform vec3 cameraPosition;

void main() {
    // Color based on break intensity
    vec3 lowBreak = vec3(0.0, 1.0, 0.0);   // Green (low break)
    vec3 highBreak = vec3(1.0, 0.0, 0.0);  // Red (high break)

    vec3 color = mix(lowBreak, highBreak, vIntensity);

    // Add rim lighting
    float rim = pow(1.0 - abs(dot(normalize(vNormalW), normalize(cameraPosition))), 2.0);
    color += vec3(1.0) * rim * 0.3;

    gl_FragColor = vec4(color, 0.8);
}

#endif

// ============================================================================
// DEPTH OF FIELD POST-PROCESS SHADER
// Cinematic focus effect with bokeh
// ============================================================================

#ifdef DOF_FRAGMENT_SHADER

precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;
uniform float focusDistance;
uniform float focalLength;
uniform float fStop;
uniform vec2 screenSize;

// Hexagonal bokeh pattern
const int BOKEH_SAMPLES = 37;

vec2 bokehPattern[37];

void initBokehPattern() {
    // Hexagonal sampling pattern
    bokehPattern[0] = vec2(0.0, 0.0);

    float angle = 0.0;
    float radius = 1.0;
    int idx = 1;

    for (int ring = 1; ring <= 6; ring++) {
        int samples = ring * 6;
        radius = float(ring) / 6.0;

        for (int i = 0; i < samples && idx < 37; i++) {
            angle = float(i) * 6.28318 / float(samples);
            bokehPattern[idx] = vec2(cos(angle), sin(angle)) * radius;
            idx++;
        }
    }
}

void main() {
    initBokehPattern();

    // Get scene depth
    float depth = texture2D(depthSampler, vUV).r;

    // Calculate circle of confusion
    float coc = abs(depth - focusDistance) * focalLength / (fStop * (focusDistance - focalLength));
    coc = clamp(coc, 0.0, 1.0);

    // Bokeh blur
    vec3 color = vec3(0.0);
    float weight = 0.0;

    float blurSize = coc * 0.05; // Max blur radius

    for (int i = 0; i < BOKEH_SAMPLES; i++) {
        vec2 offset = bokehPattern[i] * blurSize / screenSize;
        vec2 sampleUV = vUV + offset;

        if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
            vec3 sampleColor = texture2D(textureSampler, sampleUV).rgb;
            float sampleWeight = 1.0;

            color += sampleColor * sampleWeight;
            weight += sampleWeight;
        }
    }

    color /= weight;

    // Mix blurred and sharp based on CoC
    vec3 sharpColor = texture2D(textureSampler, vUV).rgb;
    color = mix(sharpColor, color, smoothstep(0.0, 0.3, coc));

    gl_FragColor = vec4(color, 1.0);
}

#endif

// End of shader library
