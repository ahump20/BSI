const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const formatNil = (value) => {
  const safeValue = toNumber(value);
  return `$${safeValue.toFixed(1)}M`;
};

export default formatNil;
