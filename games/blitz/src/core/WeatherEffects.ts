/**
 * Blaze Blitz Football - Weather Effects System
 *
 * Creates atmospheric conditions:
 * - Rain with puddles and wet field
 * - Snow with accumulation
 * - Night lights with enhanced glow
 * - Fog and mist
 * - Dynamic skybox transitions
 */

import {
  Scene,
  Vector3,
  Color3,
  Color4,
  ParticleSystem,
  Texture,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Mesh,
  HemisphericLight,
  DirectionalLight,
} from '@babylonjs/core';
import { FIELD_CONFIG } from './Field';

/** Weather type */
export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'night';

/** Weather configuration */
export interface WeatherConfig {
  type: WeatherType;
  intensity: number; // 0-1
  windSpeed: number; // Affects particle direction
  windDirection: Vector3;
}

/** Default weather presets */
const WEATHER_PRESETS: Record<WeatherType, Partial<WeatherConfig>> = {
  clear: {
    intensity: 0,
    windSpeed: 0.5,
    windDirection: new Vector3(0.2, 0, 0.1),
  },
  rain: {
    intensity: 0.7,
    windSpeed: 2,
    windDirection: new Vector3(0.3, -1, 0.1),
  },
  snow: {
    intensity: 0.5,
    windSpeed: 0.8,
    windDirection: new Vector3(0.1, -0.3, 0.05),
  },
  fog: {
    intensity: 0.6,
    windSpeed: 0.2,
    windDirection: new Vector3(0.1, 0, 0.1),
  },
  night: {
    intensity: 0.8,
    windSpeed: 0.3,
    windDirection: new Vector3(0.1, 0, 0.1),
  },
};

export class WeatherEffects {
  private scene: Scene;
  private currentWeather: WeatherConfig;

  // Particle systems
  private precipitationSystem: ParticleSystem | null = null;
  private fogSystem: ParticleSystem | null = null;

  // Visual elements
  private puddleMeshes: Mesh[] = [];
  private snowAccumulation: Mesh | null = null;

  // Lighting
  private originalAmbientIntensity: number = 0.5;
  private originalSunIntensity: number = 1.2;

  constructor(scene: Scene) {
    this.scene = scene;
    this.currentWeather = {
      type: 'clear',
      intensity: 0,
      windSpeed: 0.5,
      windDirection: new Vector3(0.2, 0, 0.1),
    };
  }

  /** Set weather conditions */
  public setWeather(type: WeatherType, intensity?: number): void {
    // Clean up previous weather
    this.cleanup();

    // Get preset
    const preset = WEATHER_PRESETS[type];
    this.currentWeather = {
      type,
      intensity: intensity ?? preset.intensity ?? 0.5,
      windSpeed: preset.windSpeed ?? 1,
      windDirection: preset.windDirection ?? new Vector3(0, -1, 0),
    };

    // Apply weather effects
    switch (type) {
      case 'rain':
        this.createRain();
        this.createPuddles();
        this.adjustLightingForRain();
        break;
      case 'snow':
        this.createSnow();
        this.createSnowAccumulation();
        this.adjustLightingForSnow();
        break;
      case 'fog':
        this.createFog();
        break;
      case 'night':
        this.adjustLightingForNight();
        break;
      case 'clear':
      default:
        this.resetLighting();
        break;
    }
  }

  /** Create rain effect */
  private createRain(): void {
    this.precipitationSystem = new ParticleSystem('rain', 5000, this.scene);

    // Rain drop texture (simple line)
    this.precipitationSystem.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAQCAYAAAA+s8JDAAAAGElEQVQIW2NkYGD4z8DAwMjAAAJ0IAwGABt/AQGWQVpOAAAAAElFTkSuQmCC',
      this.scene
    );

    // Emitter covers field area
    const fieldLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    this.precipitationSystem.emitter = new Vector3(0, 30, FIELD_CONFIG.length / 2);
    this.precipitationSystem.minEmitBox = new Vector3(-40, 0, -fieldLength / 2);
    this.precipitationSystem.maxEmitBox = new Vector3(40, 5, fieldLength / 2);

    // Rain color
    this.precipitationSystem.color1 = new Color4(0.6, 0.7, 0.8, 0.6);
    this.precipitationSystem.color2 = new Color4(0.5, 0.6, 0.7, 0.4);
    this.precipitationSystem.colorDead = new Color4(0.4, 0.5, 0.6, 0);

    // Size (thin drops)
    this.precipitationSystem.minSize = 0.02;
    this.precipitationSystem.maxSize = 0.05;

    // Lifetime
    this.precipitationSystem.minLifeTime = 0.3;
    this.precipitationSystem.maxLifeTime = 0.8;

    // Emit rate based on intensity
    this.precipitationSystem.emitRate = 2000 * this.currentWeather.intensity;

    // Direction (mostly down with wind)
    const wind = this.currentWeather.windDirection.scale(this.currentWeather.windSpeed);
    this.precipitationSystem.direction1 = wind.add(new Vector3(-0.1, -1, -0.1));
    this.precipitationSystem.direction2 = wind.add(new Vector3(0.1, -1, 0.1));

    // Speed
    this.precipitationSystem.minEmitPower = 15;
    this.precipitationSystem.maxEmitPower = 25;

    // Gravity
    this.precipitationSystem.gravity = new Vector3(0, -30, 0);

    this.precipitationSystem.start();
  }

  /** Create puddles on field */
  private createPuddles(): void {
    const puddleCount = Math.floor(10 * this.currentWeather.intensity);
    const puddleMat = new PBRMaterial('puddleMat', this.scene);
    puddleMat.albedoColor = new Color3(0.2, 0.3, 0.4);
    puddleMat.roughness = 0.1;
    puddleMat.metallic = 0.8;
    puddleMat.alpha = 0.5;

    for (let i = 0; i < puddleCount; i++) {
      const puddle = MeshBuilder.CreateDisc(
        `puddle_${i}`,
        {
          radius: 1 + Math.random() * 2,
          tessellation: 16,
        },
        this.scene
      );

      puddle.material = puddleMat;
      puddle.rotation.x = Math.PI / 2;
      puddle.position.x = (Math.random() - 0.5) * 40;
      puddle.position.y = 0.02;
      puddle.position.z = Math.random() * FIELD_CONFIG.length;

      this.puddleMeshes.push(puddle);
    }
  }

  /** Adjust lighting for rain */
  private adjustLightingForRain(): void {
    // Darken scene
    this.scene.clearColor = new Color4(0.15, 0.18, 0.22, 1);

    // Increase fog
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.01;
    this.scene.fogColor = new Color3(0.4, 0.45, 0.5);

    // Reduce light intensity
    this.scene.lights.forEach((light) => {
      if (light instanceof HemisphericLight) {
        light.intensity *= 0.6;
      } else if (light instanceof DirectionalLight) {
        light.intensity *= 0.5;
      }
    });
  }

  /** Create snow effect */
  private createSnow(): void {
    this.precipitationSystem = new ParticleSystem('snow', 3000, this.scene);

    // Snowflake texture
    this.precipitationSystem.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAASElEQVQYV2NkYGD4z8DAwMgABYwMDAz/GRgY/jEwMPxnYGBkYGBghMhBBBiRuCgSyJJIKpAlUSSQJJEl0CRQJJAl8UigiAMAJTwPD3ydE2AAAAAASUVORK5CYII=',
      this.scene
    );

    // Emitter
    const fieldLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    this.precipitationSystem.emitter = new Vector3(0, 25, FIELD_CONFIG.length / 2);
    this.precipitationSystem.minEmitBox = new Vector3(-45, 0, -fieldLength / 2);
    this.precipitationSystem.maxEmitBox = new Vector3(45, 5, fieldLength / 2);

    // Snow color (white to light blue)
    this.precipitationSystem.color1 = new Color4(1, 1, 1, 0.9);
    this.precipitationSystem.color2 = new Color4(0.9, 0.95, 1, 0.7);
    this.precipitationSystem.colorDead = new Color4(0.8, 0.9, 1, 0);

    // Size (fluffy flakes)
    this.precipitationSystem.minSize = 0.05;
    this.precipitationSystem.maxSize = 0.15;

    // Lifetime (slow fall)
    this.precipitationSystem.minLifeTime = 2;
    this.precipitationSystem.maxLifeTime = 5;

    // Emit rate
    this.precipitationSystem.emitRate = 1000 * this.currentWeather.intensity;

    // Direction (gentle drift)
    const wind = this.currentWeather.windDirection.scale(this.currentWeather.windSpeed);
    this.precipitationSystem.direction1 = wind.add(new Vector3(-0.3, -0.5, -0.3));
    this.precipitationSystem.direction2 = wind.add(new Vector3(0.3, -0.2, 0.3));

    // Speed (slow)
    this.precipitationSystem.minEmitPower = 1;
    this.precipitationSystem.maxEmitPower = 3;

    // Light gravity
    this.precipitationSystem.gravity = new Vector3(0, -2, 0);

    // Rotation for tumbling effect
    this.precipitationSystem.minAngularSpeed = -2;
    this.precipitationSystem.maxAngularSpeed = 2;

    this.precipitationSystem.start();
  }

  /** Create snow accumulation on field */
  private createSnowAccumulation(): void {
    const snow = MeshBuilder.CreateGround(
      'snowAccumulation',
      {
        width: FIELD_CONFIG.width + 20,
        height: FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2 + 10,
      },
      this.scene
    );

    const snowMat = new PBRMaterial('snowMat', this.scene);
    snowMat.albedoColor = new Color3(0.95, 0.97, 1);
    snowMat.roughness = 0.9;
    snowMat.metallic = 0;
    snowMat.alpha = 0.4 * this.currentWeather.intensity;

    snow.material = snowMat;
    snow.position.y = 0.03;
    snow.position.z = FIELD_CONFIG.length / 2;

    this.snowAccumulation = snow;
  }

  /** Adjust lighting for snow */
  private adjustLightingForSnow(): void {
    // Brighter, colder scene
    this.scene.clearColor = new Color4(0.6, 0.65, 0.75, 1);

    // Light fog
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.005;
    this.scene.fogColor = new Color3(0.8, 0.85, 0.9);

    // Cooler light tint
    this.scene.lights.forEach((light) => {
      if (light instanceof HemisphericLight) {
        light.diffuse = new Color3(0.9, 0.95, 1);
        light.intensity *= 0.9;
      }
    });
  }

  /** Create fog effect */
  private createFog(): void {
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.015 * this.currentWeather.intensity;
    this.scene.fogColor = new Color3(0.6, 0.65, 0.7);

    // Low-lying fog particles
    this.fogSystem = new ParticleSystem('fogParticles', 500, this.scene);

    this.fogSystem.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAK0lEQVQ4T2NkYGD4z0ABYBw1gOJQGDVgNAwGQ0LjP+NoKIwmJIozMjAwAAAmCAEBR8cYlgAAAABJRU5ErkJggg==',
      this.scene
    );

    const fieldLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    this.fogSystem.emitter = new Vector3(0, 1, FIELD_CONFIG.length / 2);
    this.fogSystem.minEmitBox = new Vector3(-50, -1, -fieldLength / 2);
    this.fogSystem.maxEmitBox = new Vector3(50, 3, fieldLength / 2);

    this.fogSystem.color1 = new Color4(0.7, 0.75, 0.8, 0.3);
    this.fogSystem.color2 = new Color4(0.6, 0.65, 0.7, 0.15);
    this.fogSystem.colorDead = new Color4(0.5, 0.55, 0.6, 0);

    this.fogSystem.minSize = 3;
    this.fogSystem.maxSize = 8;

    this.fogSystem.minLifeTime = 3;
    this.fogSystem.maxLifeTime = 8;

    this.fogSystem.emitRate = 50 * this.currentWeather.intensity;

    this.fogSystem.direction1 = new Vector3(-0.5, 0.1, -0.5);
    this.fogSystem.direction2 = new Vector3(0.5, 0.2, 0.5);

    this.fogSystem.minEmitPower = 0.5;
    this.fogSystem.maxEmitPower = 1.5;

    this.fogSystem.start();
  }

  /** Adjust lighting for night game */
  private adjustLightingForNight(): void {
    // Dark sky
    this.scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);

    // Reduce ambient
    this.scene.lights.forEach((light) => {
      if (light instanceof HemisphericLight) {
        this.originalAmbientIntensity = light.intensity;
        light.intensity = 0.15;
        light.diffuse = new Color3(0.3, 0.3, 0.4);
      } else if (light instanceof DirectionalLight) {
        // Moonlight
        this.originalSunIntensity = light.intensity;
        light.intensity = 0.3;
        light.diffuse = new Color3(0.6, 0.65, 0.8);
      }
    });

    // Light fog for atmosphere
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.003;
    this.scene.fogColor = new Color3(0.05, 0.05, 0.1);
  }

  /** Reset lighting to defaults */
  private resetLighting(): void {
    this.scene.clearColor = new Color4(0.05, 0.05, 0.15, 1);
    this.scene.fogMode = Scene.FOGMODE_NONE;

    this.scene.lights.forEach((light) => {
      if (light instanceof HemisphericLight) {
        light.intensity = this.originalAmbientIntensity || 0.5;
        light.diffuse = new Color3(0.9, 0.9, 1.0);
      } else if (light instanceof DirectionalLight) {
        light.intensity = this.originalSunIntensity || 1.2;
        light.diffuse = Color3.White();
      }
    });
  }

  /** Get current weather */
  public getWeather(): WeatherConfig {
    return { ...this.currentWeather };
  }

  /** Clean up weather effects */
  private cleanup(): void {
    this.precipitationSystem?.dispose();
    this.precipitationSystem = null;

    this.fogSystem?.dispose();
    this.fogSystem = null;

    this.puddleMeshes.forEach((m) => m.dispose());
    this.puddleMeshes = [];

    this.snowAccumulation?.dispose();
    this.snowAccumulation = null;
  }

  /** Dispose all weather effects */
  public dispose(): void {
    this.cleanup();
    this.resetLighting();
  }
}
