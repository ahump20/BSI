/**
 * Shader constants and uniform names
 * These values are derived from the GLSL shaders and _mangle_globals.ts
 * They must stay in sync with the shader source files
 */

// Mangled uniform names (from _mangle_globals.ts)
export const uniformName_projectionMatrix = "a";
export const uniformName_viewMatrix = "b";
export const uniformName_worldTransforms = "j";
export const uniformName_aColor = "d";
export const uniformName_aNormal = "e";
export const uniformName_aPosition = "f";
export const uniformName_csm_texture0 = "g";
export const uniformName_csm_texture1 = "h";
export const uniformName_csm_matrices = "i";
export const uniformName_viewPos = "k";
export const uniformName_groundTexture = "q";
export const uniformName_iResolution = "j";

// Shader #define constants
export const CSM_TEXTURE_SIZE = 2048;
export const CSM_PLANE_DISTANCE = 55;
export const COLLISION_TEXTURE_SIZE = 128;
export const zNear = 0.3;
export const zFar = 181;
