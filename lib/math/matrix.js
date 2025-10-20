const EPSILON = 1e-9;

export function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

export function multiply(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error('Matrix multiply requires array inputs');
  }

  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = Array.isArray(b[0]) ? b[0].length : 1;

  const bMatrix = Array.isArray(b[0]) ? b : b.map((value) => [value]);

  if (aCols !== bRows) {
    throw new Error(`Matrix dimension mismatch: ${aCols} vs ${bRows}`);
  }

  const result = Array.from({ length: aRows }, () => Array(bCols).fill(0));

  for (let i = 0; i < aRows; i++) {
    for (let k = 0; k < aCols; k++) {
      const aVal = a[i][k];
      if (aVal === 0) continue;
      for (let j = 0; j < bCols; j++) {
        result[i][j] += aVal * bMatrix[k][j];
      }
    }
  }

  return result;
}

export function identity(size) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    matrix[i][i] = 1;
  }
  return matrix;
}

export function add(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error('Matrix addition dimension mismatch');
  }
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

export function addToDiagonal(matrix, value) {
  return matrix.map((row, i) => {
    const newRow = row.slice();
    newRow[i] += value;
    return newRow;
  });
}

export function invert(matrix) {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row.map((value) => value),
    ...identity(n)[i],
  ]);

  for (let i = 0; i < n; i++) {
    let pivot = augmented[i][i];
    if (Math.abs(pivot) < EPSILON) {
      let swapRow = i + 1;
      while (swapRow < n && Math.abs(augmented[swapRow][i]) < EPSILON) {
        swapRow++;
      }
      if (swapRow === n) {
        throw new Error('Matrix is singular and cannot be inverted');
      }
      const temp = augmented[i];
      augmented[i] = augmented[swapRow];
      augmented[swapRow] = temp;
      pivot = augmented[i][i];
    }

    const pivotInv = 1 / pivot;
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] *= pivotInv;
    }

    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = augmented[r][i];
      if (Math.abs(factor) < EPSILON) continue;
      for (let c = 0; c < 2 * n; c++) {
        augmented[r][c] -= factor * augmented[i][c];
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

export function dot(a, b) {
  if (a.length !== b.length) {
    throw new Error('Dot product requires equal length vectors');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function vectorAdd(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vector addition requires equal length vectors');
  }
  return a.map((value, index) => value + b[index]);
}

export function scalarMultiplyVector(scalar, vector) {
  return vector.map((value) => value * scalar);
}
