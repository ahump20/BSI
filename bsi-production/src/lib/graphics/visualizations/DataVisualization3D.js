/**
 * 3D Data Visualization
 *
 * Creates stunning 3D visualizations for sports analytics data.
 * Features interactive charts, heat maps, and volumetric representations
 * using BSI brand colors.
 *
 * @author Austin Humphrey
 */

import * as THREE from 'three';
import { threeColors } from '../../../styles/tokens/colors.js';

export class DataVisualization3D {
  constructor(engine, data, options = {}) {
    this.engine = engine;
    this.data = data;
    this.options = {
      type: 'bar', // 'bar', 'line', 'heatmap', 'volumetric'
      interactive: true,
      animated: true,
      ...options,
    };

    this.mesh = null;
    this.interactiveObjects = [];
    this.animationOffset = 0;

    this.create();
  }

  create() {
    switch (this.options.type) {
      case 'bar':
        this.createBarChart();
        break;
      case 'line':
        this.createLineChart();
        break;
      case 'heatmap':
        this.createHeatmap();
        break;
      case 'volumetric':
        this.createVolumetric();
        break;
      default:
        this.createBarChart();
    }

    if (this.mesh) {
      this.engine.getScene().add(this.mesh);

      if (this.options.interactive) {
        this.engine.addInteractiveObject(this);
      }
    }
  }

  createBarChart() {
    const group = new THREE.Group();
    const barCount = this.data.length;
    const spacing = 1.5;
    const maxValue = Math.max(...this.data.map(d => d.value));

    this.data.forEach((item, index) => {
      const height = (item.value / maxValue) * 5;
      const width = 0.8;
      const depth = 0.8;

      // Create bar geometry
      const geometry = new THREE.BoxGeometry(width, height, depth);

      // Color based on value (using brand gradient)
      const colorValue = item.value / maxValue;
      let color;
      if (colorValue > 0.7) {
        color = new THREE.Color(threeColors.ember);
      } else if (colorValue > 0.4) {
        color = new THREE.Color(threeColors.burntOrange);
      } else {
        color = new THREE.Color(threeColors.gold);
      }

      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.3,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(
        (index - barCount / 2) * spacing,
        height / 2,
        0
      );

      // Add glow effect
      const glowGeometry = new THREE.BoxGeometry(width * 1.1, height * 1.1, depth * 1.1);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      bar.add(glow);

      // Store data reference
      bar.userData = {
        originalHeight: height,
        value: item.value,
        label: item.label,
        index: index,
      };

      group.add(bar);
      this.interactiveObjects.push(bar);
    });

    this.mesh = group;
  }

  createLineChart() {
    const group = new THREE.Group();
    const points = [];
    const maxValue = Math.max(...this.data.map(d => d.value));
    const pointCount = this.data.length;
    const spacing = 10 / pointCount;

    // Create points
    this.data.forEach((item, index) => {
      const x = (index - pointCount / 2) * spacing;
      const y = (item.value / maxValue) * 5;
      const z = 0;
      points.push(new THREE.Vector3(x, y, z));
    });

    // Create curve
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false);

    const material = new THREE.MeshStandardMaterial({
      color: threeColors.ember,
      emissive: threeColors.ember,
      emissiveIntensity: 0.5,
    });

    const line = new THREE.Mesh(geometry, material);
    group.add(line);

    // Add data points
    points.forEach((point, index) => {
      const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: threeColors.burntOrange,
        emissive: threeColors.ember,
        emissiveIntensity: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(point);
      sphere.userData = {
        value: this.data[index].value,
        label: this.data[index].label,
      };
      group.add(sphere);
      this.interactiveObjects.push(sphere);
    });

    this.mesh = group;
  }

  createHeatmap() {
    const group = new THREE.Group();
    const gridSize = Math.ceil(Math.sqrt(this.data.length));
    const cellSize = 1.0;
    const spacing = 1.2;
    const maxValue = Math.max(...this.data.map(d => d.value));

    this.data.forEach((item, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const value = item.value / maxValue;
      const height = value * 2;

      const geometry = new THREE.BoxGeometry(cellSize, height, cellSize);

      // Color gradient based on value
      const color = new THREE.Color().lerpColors(
        new THREE.Color(threeColors.gold),
        new THREE.Color(threeColors.ember),
        value
      );

      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: value * 0.5,
        metalness: 0.8,
        roughness: 0.2,
      });

      const cell = new THREE.Mesh(geometry, material);
      cell.position.set(
        (col - gridSize / 2) * spacing,
        height / 2,
        (row - gridSize / 2) * spacing
      );

      cell.userData = {
        value: item.value,
        label: item.label,
      };

      group.add(cell);
      this.interactiveObjects.push(cell);
    });

    this.mesh = group;
  }

  createVolumetric() {
    // Create a volumetric cloud-like visualization
    const group = new THREE.Group();
    const particles = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);

    const maxValue = Math.max(...this.data.map(d => d.value));

    for (let i = 0; i < particles; i++) {
      const i3 = i * 3;
      const dataIndex = Math.floor((i / particles) * this.data.length);
      const value = this.data[dataIndex].value / maxValue;

      // Position in sphere
      const radius = 2 + value * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Color based on value
      const color = new THREE.Color().lerpColors(
        new THREE.Color(threeColors.gold),
        new THREE.Color(threeColors.ember),
        value
      );

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    this.mesh = group;
  }

  update(delta, elapsed) {
    if (!this.options.animated || !this.mesh) return;

    this.animationOffset += delta;

    // Animate bars
    if (this.options.type === 'bar') {
      this.mesh.children.forEach((bar, index) => {
        if (bar.userData && bar.userData.originalHeight) {
          const targetHeight = bar.userData.originalHeight;
          const currentHeight = bar.scale.y * targetHeight;
          const newHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, delta * 2);
          bar.scale.y = newHeight / targetHeight;
          bar.position.y = newHeight / 2;
        }

        // Subtle rotation
        bar.rotation.y = Math.sin(elapsed + index) * 0.1;
      });
    }

    // Animate volumetric
    if (this.options.type === 'volumetric') {
      this.mesh.rotation.y += delta * 0.2;
      this.mesh.rotation.x = Math.sin(elapsed) * 0.1;
    }
  }

  onMouseMove(x, y) {
    if (!this.options.interactive) return;

    // Rotate visualization based on mouse
    if (this.mesh) {
      this.mesh.rotation.y = x * 0.5;
      this.mesh.rotation.x = -y * 0.3;
    }
  }

  dispose() {
    if (this.mesh) {
      this.engine.getScene().remove(this.mesh);

      this.mesh.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.options.interactive) {
      this.engine.removeInteractiveObject(this);
    }
  }
}

export default DataVisualization3D;
