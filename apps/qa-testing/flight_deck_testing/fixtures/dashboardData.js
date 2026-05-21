const EXPECTED_COLUMNS = [
  'Study ID',
  'Phase',
  'Therapeutic Area',
  'Indication',
  'Portfolio / Program',
  'Status',
  'Priority',
  'Target',
  'Actual',
  '% vs Plan',
  'Countries',
  'Sites',
  'Performance',
];

const FILTER_TEST_IDS = {
  therapeuticArea: 'studies-filter-therapeutic-area-trigger',
  phase: 'studies-filter-phase-trigger',
  studyStatus: 'studies-filter-study-status-trigger',
  portfolio: 'studies-filter-portfolio-trigger',
  program: 'studies-filter-program-trigger',
  region: 'studies-filter-region-trigger',
  fpiLpo: 'studies-filter-fpi-lpo-trigger',
};

const SORT_COLUMNS = ['Study ID', 'Phase', '% vs Plan', 'Performance'];

module.exports = {
  EXPECTED_COLUMNS,
  FILTER_TEST_IDS,
  SORT_COLUMNS,
};
