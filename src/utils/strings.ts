// Small string utilities
export function normalizeString(s: string) {
  return s
    .normalize('NFD')
    // remove diacritic marks
    .replace(/\p{Diacritic}/gu, '')
    // remove control chars if any
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .toLowerCase();
}

export default normalizeString;
