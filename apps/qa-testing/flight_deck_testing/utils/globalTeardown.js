const { spawnSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const scriptPath = path.join(process.cwd(), 'utils', 'packageEvidence.js');
  const run = spawnSync('node', [scriptPath], {
    stdio: 'inherit',
  });

  if (run.status !== 0) {
    console.warn('Evidence packaging failed during global teardown.');
  }
};
