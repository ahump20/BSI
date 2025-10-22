'use client';

import { useEffect, useRef, useState } from 'react';

type DemoState = 'initializing' | 'ready' | 'unsupported' | 'error';
type NavigatorWithWebGPU = Navigator & {
  gpu?: {
    requestAdapter?: () => Promise<GPUAdapter | null>;
    getPreferredCanvasFormat?: () => GPUTextureFormat;
  };
};

type GPUAdapter = {
  name?: string;
  requestDevice: () => Promise<GPUDevice>;
};

type GPUDevice = {
  createCommandEncoder: () => GPUCommandEncoder;
  queue: { submit: (commandBuffers: GPUCommandBuffer[]) => void };
};

type GPUCommandEncoder = {
  beginRenderPass: (descriptor: GPURenderPassDescriptor) => GPURenderPassEncoder;
  finish: () => GPUCommandBuffer;
};

type GPURenderPassDescriptor = {
  colorAttachments: Array<{
    view: GPUTextureView;
    clearValue: { r: number; g: number; b: number; a: number };
    loadOp: 'clear';
    storeOp: 'store';
  }>;
};

type GPURenderPassEncoder = {
  end: () => void;
};

type GPUCommandBuffer = unknown;

type GPUTextureView = unknown;

type GPUCanvasContext = {
  configure: (descriptor: { device: GPUDevice; format: GPUTextureFormat; alphaMode: 'opaque' | 'premultiplied' }) => void;
  getCurrentTexture: () => { createView: () => GPUTextureView };
};

type GPUTextureFormat = string;

export default function WebGPUDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<DemoState>('initializing');
  const [details, setDetails] = useState('Booting WebGPU context...');

  useEffect(() => {
    let cancelled = false;

    async function initWebGPU() {
      const nav = navigator as NavigatorWithWebGPU;
      const webgpu = nav.gpu;

      if (!webgpu || typeof webgpu.requestAdapter !== 'function') {
        setState('unsupported');
        setDetails('WebGPU is not available in this browser. Enable Chrome Canary or Edge 113+.');
        return;
      }

      try {
        const adapter = await webgpu.requestAdapter();
        if (!adapter) {
          setState('error');
          setDetails('No compatible GPU adapter found. Check system support.');
          return;
        }

        const device = await adapter.requestDevice();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
        if (!context) {
          setState('error');
          setDetails('Failed to acquire WebGPU canvas context.');
          return;
        }

        const format = webgpu.getPreferredCanvasFormat?.() ?? 'bgra8unorm';
        context.configure({
          device,
          format,
          alphaMode: 'opaque'
        });

        const encoder = device.createCommandEncoder();
        const view = context.getCurrentTexture().createView();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view,
              clearValue: { r: 0.05, g: 0.09, b: 0.17, a: 1 },
              loadOp: 'clear',
              storeOp: 'store'
            }
          ]
        });
        pass.end();
        device.queue.submit([encoder.finish()]);

        if (!cancelled) {
          setState('ready');
          setDetails(
            `WebGPU active — Adapter: ${adapter.name || 'Unknown GPU'} · Preferred format: ${format}`
          );
        }
      } catch (error) {
        console.error('[WebGPUDemo] initialization failed', error);
        if (cancelled) return;
        setState('error');
        setDetails(error instanceof Error ? error.message : 'Unknown error establishing WebGPU context.');
      }
    }

    void initWebGPU();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="webgpu-demo">
      <canvas ref={canvasRef} aria-label="WebGPU demo canvas" />
      <div className={`webgpu-demo__status webgpu-demo__status--${state}`}>
        <p>{details}</p>
      </div>
    </div>
  );
}
