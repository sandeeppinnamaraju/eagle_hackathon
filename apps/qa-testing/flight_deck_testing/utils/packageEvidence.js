const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const TEST_RESULTS_DIR = path.join(ROOT, 'test-results');
const EVIDENCE_DIR = path.join(ROOT, 'evidence');

function sanitize(value) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function walkFiles(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function timestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function collectEvidenceFiles() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    throw new Error('test-results folder was not found. Run tests first.');
  }

  const allFiles = walkFiles(TEST_RESULTS_DIR);
  return allFiles.filter((filePath) => {
    const fileName = path.basename(filePath);
    if (fileName === '.last-run') return false;
    return true;
  });
}

function buildEvidenceBundle(files, bundleDirName) {
  const bundleDir = path.join(EVIDENCE_DIR, bundleDirName);
  ensureDir(bundleDir);

  const usedNames = new Set();

  for (const filePath of files) {
    const relative = path.relative(TEST_RESULTS_DIR, filePath);
    const parts = relative.split(path.sep);
    const scenarioPart = parts.length > 1 ? parts[0] : 'misc';
    const scenarioName = sanitize(scenarioPart) || 'scenario';

    const baseName = path.parse(filePath).name;
    const extension = path.extname(filePath);
    const cleanedBase = sanitize(baseName) || 'artifact';

    let targetName = `${scenarioName}__${cleanedBase}${extension}`;
    let duplicateIndex = 2;

    while (usedNames.has(targetName) || fs.existsSync(path.join(bundleDir, targetName))) {
      targetName = `${scenarioName}__${cleanedBase}-${duplicateIndex}${extension}`;
      duplicateIndex += 1;
    }

    usedNames.add(targetName);
    fs.copyFileSync(filePath, path.join(bundleDir, targetName));
  }

  return bundleDir;
}

function zipBundle(bundleDir, zipPath) {
  const sourcePattern = path.join(bundleDir, '*');

  const command = `Compress-Archive -Path \"${sourcePattern}\" -DestinationPath \"${zipPath}\" -Force`;
  const result = spawnSync('powershell', ['-NoProfile', '-Command', command], {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Failed to create zip archive.');
  }
}

function main() {
  ensureDir(EVIDENCE_DIR);

  const stamp = timestamp();
  const bundleName = `evidence-bundle-${stamp}`;
  const zipPath = path.join(EVIDENCE_DIR, `test-evidence-${stamp}.zip`);

  const files = collectEvidenceFiles();
  if (files.length === 0) {
    throw new Error('No evidence files found under test-results.');
  }

  const bundleDir = buildEvidenceBundle(files, bundleName);
  zipBundle(bundleDir, zipPath);

  console.log(`Evidence files collected: ${files.length}`);
  console.log(`Bundle folder: ${bundleDir}`);
  console.log(`Zip file: ${zipPath}`);
}

try {
  main();
} catch (error) {
  console.error(`Evidence packaging failed: ${error.message}`);
  process.exit(1);
}
