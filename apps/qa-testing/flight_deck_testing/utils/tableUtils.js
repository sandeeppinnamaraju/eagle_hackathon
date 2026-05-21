function toNumber(value) {
  if (value == null) return Number.NaN;
  const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  return cleaned ? Number(cleaned) : Number.NaN;
}

function toPercent(value) {
  if (!value || value.includes('-') || value.includes('—')) return Number.NaN;
  return toNumber(value.replace('%', ''));
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function compareStringsAsc(a, b) {
  return normalizeText(a).localeCompare(normalizeText(b));
}

function compareStringsDesc(a, b) {
  return compareStringsAsc(b, a);
}

function compareNumbersAsc(a, b) {
  return toNumber(a) - toNumber(b);
}

function compareNumbersDesc(a, b) {
  return toNumber(b) - toNumber(a);
}

function comparePercentAsc(a, b) {
  return toPercent(a) - toPercent(b);
}

function comparePercentDesc(a, b) {
  return toPercent(b) - toPercent(a);
}

function statusWeight(status) {
  const text = normalizeText(status);
  if (text.includes('off track')) return 1;
  if (text.includes('at risk')) return 2;
  if (text.includes('on track')) return 3;
  return 0;
}

function comparePerformanceAsc(a, b) {
  return statusWeight(a) - statusWeight(b);
}

function comparePerformanceDesc(a, b) {
  return statusWeight(b) - statusWeight(a);
}

function mapExpectedPerformance(percent) {
  if (Number.isNaN(percent)) return null;
  if (percent >= 95) return 'On Track';
  if (percent >= 80) return 'At Risk';
  return 'Off Track';
}

module.exports = {
  compareNumbersAsc,
  compareNumbersDesc,
  comparePercentAsc,
  comparePercentDesc,
  comparePerformanceAsc,
  comparePerformanceDesc,
  compareStringsAsc,
  compareStringsDesc,
  mapExpectedPerformance,
  toPercent,
};
