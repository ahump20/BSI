export const formatTopProgramsList = (topPrograms) => {
  const normalized = Array.isArray(topPrograms) ? topPrograms : [];
  const trimmed = normalized.filter((program) => typeof program === 'string' && program.trim().length > 0);
  const highlighted = trimmed.slice(0, 3);
  return highlighted.length > 0 ? highlighted.join(' • ') : 'No flagship programs yet';
};
