/**
 * WGSL Compute Shader for Advanced Particle Systems
 *
 * Features:
 * - GPU-accelerated particle physics
 * - Gravitational attraction/repulsion
 * - Velocity damping
 * - Boundary conditions
 * - Color transitions
 *
 * Used for stadium atmospherics, data visualization particles,
 * and dynamic background effects
 */

// Particle structure matching CPU-side definition
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  color: vec4<f32>,
  life: f32,
  size: f32,
  mass: f32,
  _padding: f32, // Ensure 16-byte alignment
}

// Simulation parameters
struct SimulationParams {
  deltaTime: f32,
  time: f32,
  particleCount: u32,
  attractorCount: u32,

  gravity: vec3<f32>,
  damping: f32,

  boundaryMin: vec3<f32>,
  boundaryMax: vec3<f32>,

  enableAttractors: u32,
  enableBoundaries: u32,
  enableColorTransitions: u32,
  _padding: u32,
}

// Attractor/repulsor point
struct Attractor {
  position: vec3<f32>,
  strength: f32, // Positive = attract, negative = repel
  radius: f32,
  falloff: f32, // Falloff exponent
  _padding: array<f32, 2>,
}

// Bindings
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimulationParams;
@group(0) @binding(2) var<storage, read> attractors: array<Attractor>;

// Random number generation using particle index and time
fn random(seed: u32) -> f32 {
  let x = sin(f32(seed) * 12.9898 + params.time * 78.233) * 43758.5453;
  return fract(x);
}

fn random3(seed: u32) -> vec3<f32> {
  return vec3<f32>(
    random(seed),
    random(seed + 1u),
    random(seed + 2u)
  );
}

// Apply attractor/repulsor forces
fn applyAttractorForce(particle: ptr<storage, Particle, read_write>, index: u32) {
  if (params.enableAttractors == 0u) {
    return;
  }

  var totalForce = vec3<f32>(0.0, 0.0, 0.0);

  for (var i = 0u; i < params.attractorCount; i++) {
    let attractor = attractors[i];
    let toAttractor = attractor.position - (*particle).position;
    let distance = length(toAttractor);

    if (distance > 0.001 && distance < attractor.radius) {
      let direction = normalize(toAttractor);

      // Inverse square law with falloff
      let forceMagnitude = attractor.strength / pow(distance, attractor.falloff);

      totalForce += direction * forceMagnitude;
    }
  }

  (*particle).velocity += totalForce * params.deltaTime;
}

// Apply boundary conditions (bounce or wrap)
fn applyBoundaries(particle: ptr<storage, Particle, read_write>) {
  if (params.enableBoundaries == 0u) {
    return;
  }

  // Bounce off boundaries
  if ((*particle).position.x < params.boundaryMin.x) {
    (*particle).position.x = params.boundaryMin.x;
    (*particle).velocity.x = abs((*particle).velocity.x) * 0.8;
  }
  if ((*particle).position.x > params.boundaryMax.x) {
    (*particle).position.x = params.boundaryMax.x;
    (*particle).velocity.x = -abs((*particle).velocity.x) * 0.8;
  }

  if ((*particle).position.y < params.boundaryMin.y) {
    (*particle).position.y = params.boundaryMin.y;
    (*particle).velocity.y = abs((*particle).velocity.y) * 0.8;
  }
  if ((*particle).position.y > params.boundaryMax.y) {
    (*particle).position.y = params.boundaryMax.y;
    (*particle).velocity.y = -abs((*particle).velocity.y) * 0.8;
  }

  if ((*particle).position.z < params.boundaryMin.z) {
    (*particle).position.z = params.boundaryMin.z;
    (*particle).velocity.z = abs((*particle).velocity.z) * 0.8;
  }
  if ((*particle).position.z > params.boundaryMax.z) {
    (*particle).position.z = params.boundaryMax.z;
    (*particle).velocity.z = -abs((*particle).velocity.z) * 0.8;
  }
}

// Update particle color based on velocity/life
fn updateParticleColor(particle: ptr<storage, Particle, read_write>, index: u32) {
  if (params.enableColorTransitions == 0u) {
    return;
  }

  let speed = length((*particle).velocity);
  let lifeFactor = (*particle).life;

  // Color transitions based on speed (slow = blue, fast = red)
  let baseColor = vec3<f32>(
    mix(0.2, 1.0, clamp(speed * 0.1, 0.0, 1.0)),  // Red channel
    mix(0.5, 0.3, clamp(speed * 0.1, 0.0, 1.0)),  // Green channel
    mix(1.0, 0.2, clamp(speed * 0.1, 0.0, 1.0))   // Blue channel
  );

  // Apply life-based alpha fade
  (*particle).color = vec4<f32>(
    baseColor,
    lifeFactor
  );
}

// Respawn particle if life expires
fn respawnParticle(particle: ptr<storage, Particle, read_write>, index: u32) {
  if ((*particle).life <= 0.0) {
    // Reset to random position within boundaries
    let range = params.boundaryMax - params.boundaryMin;
    (*particle).position = params.boundaryMin + range * random3(index * 7u);

    // Random initial velocity
    (*particle).velocity = (random3(index * 13u) - 0.5) * 2.0;

    // Reset life
    (*particle).life = 1.0;

    // Random size variation
    (*particle).size = 0.5 + random(index * 19u) * 0.5;
  }
}

// Main compute shader
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  // Bounds check
  if (index >= params.particleCount) {
    return;
  }

  // Get particle reference
  var particle = &particles[index];

  // Apply physics
  // 1. Gravity
  (*particle).velocity += params.gravity * params.deltaTime;

  // 2. Attractor forces
  applyAttractorForce(particle, index);

  // 3. Damping (air resistance)
  (*particle).velocity *= (1.0 - params.damping * params.deltaTime);

  // 4. Update position
  (*particle).position += (*particle).velocity * params.deltaTime;

  // 5. Apply boundaries
  applyBoundaries(particle);

  // 6. Update color
  updateParticleColor(particle, index);

  // 7. Decay life
  (*particle).life -= params.deltaTime * 0.1; // 10 second lifespan

  // 8. Respawn if needed
  respawnParticle(particle, index);
}
