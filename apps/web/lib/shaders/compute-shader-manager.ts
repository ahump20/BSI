/**
 * WebGPU Compute Shader Manager for Babylon.js
 *
 * Manages WGSL compute shaders for particle systems and other GPU computations
 */

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';

export interface ParticleData {
  position: Float32Array; // vec3
  velocity: Float32Array; // vec3
  color: Float32Array; // vec4
  life: number;
  size: number;
  mass: number;
}

export interface SimulationParams {
  deltaTime: number;
  time: number;
  particleCount: number;
  attractorCount: number;
  gravity: [number, number, number];
  damping: number;
  boundaryMin: [number, number, number];
  boundaryMax: [number, number, number];
  enableAttractors: boolean;
  enableBoundaries: boolean;
  enableColorTransitions: boolean;
}

export interface Attractor {
  position: [number, number, number];
  strength: number; // Positive = attract, negative = repel
  radius: number;
  falloff: number;
}

export class ComputeShaderManager {
  private device: GPUDevice | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private bindGroup: GPUBindGroup | null = null;

  private particleBuffer: GPUBuffer | null = null;
  private paramsBuffer: GPUBuffer | null = null;
  private attractorBuffer: GPUBuffer | null = null;

  private particleCount: number = 0;

  constructor(
    private engine: Engine,
    private scene: Scene
  ) {}

  /**
   * Initialize WebGPU device and compute pipeline
   */
  async initialize(shaderCode: string, particleCount: number): Promise<boolean> {
    this.particleCount = particleCount;

    try {
      // Request GPU adapter
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) {
        console.warn('WebGPU adapter not available');
        return false;
      }

      // Request GPU device
      this.device = await adapter.requestDevice();
      if (!this.device) {
        console.warn('WebGPU device not available');
        return false;
      }

      // Create buffers
      await this.createBuffers();

      // Create compute pipeline
      await this.createComputePipeline(shaderCode);

      return true;
    } catch (error) {
      console.error('Failed to initialize WebGPU compute shader:', error);
      return false;
    }
  }

  /**
   * Create GPU buffers for particles, params, and attractors
   */
  private async createBuffers(): Promise<void> {
    if (!this.device) {
      throw new Error('GPU device not initialized');
    }

    // Particle buffer (storage buffer, read-write)
    // Each particle: position(12) + velocity(12) + color(16) + life(4) + size(4) + mass(4) + padding(4) = 56 bytes
    const particleBufferSize = this.particleCount * 56;
    this.particleBuffer = this.device.createBuffer({
      size: particleBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: false,
    });

    // Params buffer (uniform buffer)
    // SimulationParams: 96 bytes (aligned)
    this.paramsBuffer = this.device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: false,
    });

    // Attractor buffer (storage buffer, read-only)
    // Max 16 attractors: position(12) + strength(4) + radius(4) + falloff(4) + padding(8) = 32 bytes each
    this.attractorBuffer = this.device.createBuffer({
      size: 16 * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: false,
    });
  }

  /**
   * Create compute pipeline with shader code
   */
  private async createComputePipeline(shaderCode: string): Promise<void> {
    if (!this.device) {
      throw new Error('GPU device not initialized');
    }

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    // Create pipeline layout
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    // Create compute pipeline
    this.computePipeline = this.device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.particleBuffer! },
        },
        {
          binding: 1,
          resource: { buffer: this.paramsBuffer! },
        },
        {
          binding: 2,
          resource: { buffer: this.attractorBuffer! },
        },
      ],
    });
  }

  /**
   * Update particle data
   */
  updateParticles(particles: ParticleData[]): void {
    if (!this.device || !this.particleBuffer) {
      return;
    }

    const data = new Float32Array(particles.length * 14); // 14 floats per particle
    let offset = 0;

    for (const particle of particles) {
      data.set(particle.position, offset);
      offset += 3;
      data.set(particle.velocity, offset);
      offset += 3;
      data.set(particle.color, offset);
      offset += 4;
      data[offset++] = particle.life;
      data[offset++] = particle.size;
      data[offset++] = particle.mass;
      data[offset++] = 0; // padding
    }

    this.device.queue.writeBuffer(this.particleBuffer, 0, data);
  }

  /**
   * Update simulation parameters
   */
  updateParams(params: SimulationParams): void {
    if (!this.device || !this.paramsBuffer) {
      return;
    }

    const data = new Float32Array(24); // 96 bytes / 4 = 24 floats
    let offset = 0;

    data[offset++] = params.deltaTime;
    data[offset++] = params.time;
    data[offset++] = params.particleCount;
    data[offset++] = params.attractorCount;

    data.set(params.gravity, offset);
    offset += 3;
    data[offset++] = params.damping;

    data.set(params.boundaryMin, offset);
    offset += 3;
    offset++; // padding

    data.set(params.boundaryMax, offset);
    offset += 3;
    offset++; // padding

    data[offset++] = params.enableAttractors ? 1 : 0;
    data[offset++] = params.enableBoundaries ? 1 : 0;
    data[offset++] = params.enableColorTransitions ? 1 : 0;
    data[offset++] = 0; // padding

    this.device.queue.writeBuffer(this.paramsBuffer, 0, data);
  }

  /**
   * Update attractors
   */
  updateAttractors(attractors: Attractor[]): void {
    if (!this.device || !this.attractorBuffer) {
      return;
    }

    const data = new Float32Array(attractors.length * 8); // 8 floats per attractor
    let offset = 0;

    for (const attractor of attractors) {
      data.set(attractor.position, offset);
      offset += 3;
      data[offset++] = attractor.strength;
      data[offset++] = attractor.radius;
      data[offset++] = attractor.falloff;
      data[offset++] = 0; // padding
      data[offset++] = 0; // padding
    }

    this.device.queue.writeBuffer(this.attractorBuffer, 0, data);
  }

  /**
   * Execute compute shader
   */
  compute(): void {
    if (!this.device || !this.computePipeline || !this.bindGroup) {
      return;
    }

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);

    // Dispatch with workgroup size 256
    const workgroupCount = Math.ceil(this.particleCount / 256);
    passEncoder.dispatchWorkgroups(workgroupCount);

    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Read particle data back from GPU
   */
  async readParticles(): Promise<ParticleData[]> {
    if (!this.device || !this.particleBuffer) {
      return [];
    }

    // Create staging buffer
    const stagingBuffer = this.device.createBuffer({
      size: this.particleBuffer.size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Copy from particle buffer to staging buffer
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      this.particleBuffer,
      0,
      stagingBuffer,
      0,
      this.particleBuffer.size
    );
    this.device.queue.submit([commandEncoder.finish()]);

    // Map and read
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(stagingBuffer.getMappedRange());

    // Parse particle data
    const particles: ParticleData[] = [];
    let offset = 0;

    for (let i = 0; i < this.particleCount; i++) {
      particles.push({
        position: data.slice(offset, offset + 3),
        velocity: data.slice(offset + 3, offset + 6),
        color: data.slice(offset + 6, offset + 10),
        life: data[offset + 10],
        size: data[offset + 11],
        mass: data[offset + 12],
      });
      offset += 14;
    }

    stagingBuffer.unmap();
    stagingBuffer.destroy();

    return particles;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.particleBuffer?.destroy();
    this.paramsBuffer?.destroy();
    this.attractorBuffer?.destroy();

    this.particleBuffer = null;
    this.paramsBuffer = null;
    this.attractorBuffer = null;
    this.computePipeline = null;
    this.bindGroup = null;
    this.device = null;
  }
}
