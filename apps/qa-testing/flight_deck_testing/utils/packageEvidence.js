const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const TEST_RESULTS_DIR = path.join(ROOT, 'test-results');
const PLAYWRIGHT_REPORT_DIR = path.join(ROOT, 'playwright-report');
const EVIDENCE_DIR = path.join(ROOT, 'evidence');
const JSON_REPORT_FILE = path.join(EVIDENCE_DIR, 'latest-playwright-report.json');

function getFallbackReportFile() {
  if (!fs.existsSync(EVIDENCE_DIR)) return null;

  const files = fs
    .readdirSync(EVIDENCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /report\.json$/i.test(entry.name))
    .map((entry) => path.join(EVIDENCE_DIR, entry.name));

  if (files.length === 0) return null;

  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

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

function tryReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    const buffer = fs.readFileSync(filePath);

    const asUtf8 = buffer.toString('utf8');
    try {
      return JSON.parse(asUtf8);
    } catch {
      const asUtf16 = buffer.toString('utf16le').replace(/^\uFEFF/, '');
      return JSON.parse(asUtf16);
    }
  } catch {
    return null;
  }
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
  const collected = [];
  const selectedJsonReport = fs.existsSync(JSON_REPORT_FILE) ? JSON_REPORT_FILE : getFallbackReportFile();

  if (fs.existsSync(TEST_RESULTS_DIR)) {
    const allTestResultFiles = walkFiles(TEST_RESULTS_DIR);
    for (const filePath of allTestResultFiles) {
      const fileName = path.basename(filePath);
      if (fileName === '.last-run') continue;

      collected.push({
        sourceGroup: 'test-results',
        relativePath: path.relative(TEST_RESULTS_DIR, filePath),
        filePath,
      });
    }
  }

  if (fs.existsSync(PLAYWRIGHT_REPORT_DIR)) {
    const reportFiles = walkFiles(PLAYWRIGHT_REPORT_DIR);
    for (const filePath of reportFiles) {
      collected.push({
        sourceGroup: 'playwright-report',
        relativePath: path.relative(PLAYWRIGHT_REPORT_DIR, filePath),
        filePath,
      });
    }
  }

  if (selectedJsonReport && fs.existsSync(selectedJsonReport)) {
    collected.push({
      sourceGroup: 'json-report',
      relativePath: path.basename(selectedJsonReport),
      filePath: selectedJsonReport,
    });
  }

  return {
    files: collected,
    selectedJsonReport,
  };
}

function buildEvidenceBundle(files, bundleDirName) {
  const bundleDir = path.join(EVIDENCE_DIR, bundleDirName);
  ensureDir(bundleDir);

  const usedNames = new Set();

  for (const file of files) {
    const parts = file.relativePath.split(path.sep);
    const scenarioPart = parts.length > 1 ? parts[0] : file.sourceGroup;
    const scenarioName = sanitize(scenarioPart) || 'scenario';

    const baseName = path.parse(file.filePath).name;
    const extension = path.extname(file.filePath);
    const cleanedBase = sanitize(baseName) || 'artifact';

    let targetName = `${scenarioName}__${cleanedBase}${extension}`;
    let duplicateIndex = 2;

    while (usedNames.has(targetName) || fs.existsSync(path.join(bundleDir, targetName))) {
      targetName = `${scenarioName}__${cleanedBase}-${duplicateIndex}${extension}`;
      duplicateIndex += 1;
    }

    usedNames.add(targetName);
    fs.copyFileSync(file.filePath, path.join(bundleDir, targetName));
  }

  return bundleDir;
}

function writeSummary(bundleDir, files, reportFilePath) {
  const report = tryReadJson(reportFilePath);
  const lines = [];
  const now = new Date().toISOString();

  lines.push('# Evidence Summary');
  lines.push('');
  lines.push(`Generated: ${now}`);

  if (report && report.stats) {
    const expected = Number(report.stats.expected || 0);
    const unexpected = Number(report.stats.unexpected || 0);
    const skipped = Number(report.stats.skipped || 0);
    const flaky = Number(report.stats.flaky || 0);
    const total = expected + unexpected + skipped;

    lines.push(`Passed: ${expected}`);
    lines.push(`Failed: ${unexpected}`);
    lines.push(`Skipped: ${skipped}`);
    lines.push(`Flaky: ${flaky}`);
    lines.push(`Total: ${total}`);
  } else {
    lines.push('Run stats: unavailable (no parseable report JSON found).');
  }

  lines.push(`Collected artifacts: ${files.length}`);

  const summaryContent = `${lines.join('\n')}\n`;
  const bundleSummaryPath = path.join(bundleDir, 'run-summary.md');
  const latestSummaryPath = path.join(EVIDENCE_DIR, 'latest-evidence-summary.md');

  fs.writeFileSync(bundleSummaryPath, summaryContent, 'utf8');
  fs.writeFileSync(latestSummaryPath, summaryContent, 'utf8');

  return {
    bundleSummaryPath,
    latestSummaryPath,
  };
}

function zipBundle(bundleDir, zipPath) {
  const sourcePattern = path.join(bundleDir, '*');
  const command = `Compress-Archive -Path \"${sourcePattern}\" -DestinationPath \"${zipPath}\" -Force`;
  const result = spawnSync('powershell', ['-NoProfile', '-Command', command], {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    console.error('Compress-Archive failed.');
    console.error('stdout:', result.stdout);
    console.error('stderr:', result.stderr);
    throw new Error(result.stderr || result.stdout || 'Failed to create zip archive.');
  }
}

function main() {
  ensureDir(EVIDENCE_DIR);

  const stamp = timestamp();
  const bundleName = `evidence-bundle-${stamp}`;
  const zipPath = path.join(EVIDENCE_DIR, `test-evidence-${stamp}.zip`);

  const collected = collectEvidenceFiles();
  if (collected.files.length === 0) {
    throw new Error('No evidence files found. Run tests first.');
  }

  const bundleDir = buildEvidenceBundle(collected.files, bundleName);
  const summaryPaths = writeSummary(bundleDir, collected.files, collected.selectedJsonReport);
  zipBundle(bundleDir, zipPath);

  console.log(`Evidence files collected: ${collected.files.length}`);
  if (collected.selectedJsonReport) {
    console.log(`Report source: ${collected.selectedJsonReport}`);
  }
  console.log(`Bundle folder: ${bundleDir}`);
  console.log(`Bundle summary: ${summaryPaths.bundleSummaryPath}`);
  console.log(`Latest summary: ${summaryPaths.latestSummaryPath}`);
  console.log(`Zip file: ${zipPath}`);
}

try {
  main();
} catch (error) {
  console.error(`Evidence packaging failed: ${error.message}`);
  process.exit(1);
}
