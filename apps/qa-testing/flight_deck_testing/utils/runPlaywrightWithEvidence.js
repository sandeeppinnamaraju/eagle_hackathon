const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCommand(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
  });
}

function main() {
  fs.mkdirSync(path.join(process.cwd(), 'evidence'), { recursive: true });

  const playwrightArgs = process.argv.slice(2);
  const testRun = runCommand('npx', ['playwright', 'test', ...playwrightArgs]);

  const packerPath = path.join('utils', 'packageEvidence.js');
  const packRun = runCommand('node', [packerPath]);

  if (packRun.status !== 0) {
    console.error('Warning: evidence packaging failed.');
  }

  if (typeof testRun.status === 'number') {
    process.exit(testRun.status);
  }

  process.exit(1);
}

main();
