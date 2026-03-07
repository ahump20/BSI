/** Format a rate stat as .XXX (strips leading zero, e.g. 0.321 → ".321") */
export const fmt3 = (v: number): string => v.toFixed(3).replace(/^0/, '');
