// Re-export shader constants for convenience
export { zNear, zFar, CSM_PLANE_DISTANCE } from "../shaders/shader-constants";

export const fieldOfViewDegrees = 60;

export const fieldOfViewRadians = (fieldOfViewDegrees * Math.PI) / 180; // in radians

export const fieldOfViewAmount = 1 / Math.tan(fieldOfViewRadians / 2);

export const mat_perspective = (near: number, far: number, mx: number, my: number) =>
  new DOMMatrix([
    mx,
    0,
    0,
    0,
    0,
    my,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ]);
