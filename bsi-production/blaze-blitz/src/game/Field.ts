/**
 * Field.ts
 * Generates the football field geometry with yard lines
 * Uses a 60-yard scaled field (half gridiron) with 30-yard first downs
 */

import * as BABYLON from '@babylonjs/core';
import { FIELD_CONFIG } from './types';

export class Field {
  private scene: BABYLON.Scene;
  
  // Field dimensions in meters (scaled)
  private readonly length = FIELD_CONFIG.length;
  private readonly width = FIELD_CONFIG.width;
  
  // Colors
  private readonly grassColor = new BABYLON.Color3(0.1, 0.4, 0.15); // Dark grass
  private readonly lineColor = new BABYLON.Color3(1, 1, 1); // White lines
  private readonly endZoneHomeColor = new BABYLON.Color3(0.75, 0.35, 0); // Burnt orange
  private readonly endZoneAwayColor = new BABYLON.Color3(0.3, 0.3, 0.4); // Wolves gray

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    this.createGround();
    this.createYardLines();
    this.createEndZones();
    this.createSidelines();
  }

  private createGround(): void {
    const ground = BABYLON.MeshBuilder.CreateGround('field', {
      width: this.width,
      height: this.length
    }, this.scene);
    
    const material = new BABYLON.StandardMaterial('grass', this.scene);
    material.diffuseColor = this.grassColor;
    material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = material;
    ground.receiveShadows = true;
  }

  private createYardLines(): void {
    const lineMaterial = new BABYLON.StandardMaterial('line', this.scene);
    lineMaterial.diffuseColor = this.lineColor;
    lineMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    
    // Create yard lines every 10 yards
    for (let i = 0; i <= 6; i++) {
      const z = -this.length / 2 + FIELD_CONFIG.endZoneDepth + (i * 10);
      
      const line = BABYLON.MeshBuilder.CreateBox(`yardLine${i * 10}`, {
        width: this.width - 1,
        height: 0.05,
        depth: 0.15
      }, this.scene);
      
      line.position.y = 0.01;
      line.position.z = z;
      line.material = lineMaterial;
    }
    
    // Hash marks on sides
    this.createHashMarks(lineMaterial);
  }

  private createHashMarks(material: BABYLON.StandardMaterial): void {
    const hashWidth = 0.5;
    const hashDepth = 0.1;
    const hashOffset = this.width / 3;
    
    for (let i = 0; i <= 60; i += 5) {
      if (i % 10 === 0) continue; // Skip main yard lines
      
      const z = -this.length / 2 + FIELD_CONFIG.endZoneDepth + i;
      
      // Left hash
      const leftHash = BABYLON.MeshBuilder.CreateBox(`hashL${i}`, {
        width: hashWidth,
        height: 0.03,
        depth: hashDepth
      }, this.scene);
      leftHash.position.set(-hashOffset, 0.01, z);
      leftHash.material = material;
      
      // Right hash
      const rightHash = leftHash.clone(`hashR${i}`);
      rightHash.position.x = hashOffset;
    }
  }

  private createEndZones(): void {
    const ezDepth = FIELD_CONFIG.endZoneDepth;
    
    // Home end zone (bottom)
    const homeEZ = BABYLON.MeshBuilder.CreateGround('homeEndZone', {
      width: this.width,
      height: ezDepth
    }, this.scene);
    homeEZ.position.z = -this.length / 2 + ezDepth / 2;
    
    const homeMat = new BABYLON.StandardMaterial('homeEZMat', this.scene);
    homeMat.diffuseColor = this.endZoneHomeColor;
    homeMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
    homeEZ.material = homeMat;

    // Away end zone (top)
    const awayEZ = BABYLON.MeshBuilder.CreateGround('awayEndZone', {
      width: this.width,
      height: ezDepth
    }, this.scene);
    awayEZ.position.z = this.length / 2 - ezDepth / 2;
    
    const awayMat = new BABYLON.StandardMaterial('awayEZMat', this.scene);
    awayMat.diffuseColor = this.endZoneAwayColor;
    awayMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    awayEZ.material = awayMat;
  }

  private createSidelines(): void {
    const lineMaterial = new BABYLON.StandardMaterial('sideline', this.scene);
    lineMaterial.diffuseColor = this.lineColor;
    
    // Left sideline
    const leftLine = BABYLON.MeshBuilder.CreateBox('leftSideline', {
      width: 0.2,
      height: 0.05,
      depth: this.length
    }, this.scene);
    leftLine.position.set(-this.width / 2 + 0.5, 0.01, 0);
    leftLine.material = lineMaterial;
    
    // Right sideline
    const rightLine = leftLine.clone('rightSideline');
    rightLine.position.x = this.width / 2 - 0.5;
  }

  /** Get field boundaries for collision */
  getBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return {
      minX: -this.width / 2 + 1,
      maxX: this.width / 2 - 1,
      minZ: -this.length / 2,
      maxZ: this.length / 2
    };
  }
}
