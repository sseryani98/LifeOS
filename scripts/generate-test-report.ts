import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const COVERAGE_DIR = join(process.cwd(), 'coverage');
const TEST_RESULTS_FILE = join(COVERAGE_DIR, 'test-results.json');
const REPORTS_DIR = join(process.cwd(), 'project', 'test-reports');
const MAX_REPORTS = 5;

interface TestResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  startTime: number;
  testResults: Array<{
    testFilePath: string;
    testResults: Array<{
      ancestorTitles: string[];
      title: string;
      status: string;
      failureMessages: string[];
    }>;
  }>;
}

interface CoverageSummary {
  total: {
    lines: { pct: number };
    branches: { pct: number };
  };
  [filePath: string]: {
    lines: { pct: number };
    branches: { pct: number };
  };
}

/**
 * Generates a markdown test report from Jest JSON output and coverage summary.
 * Implements rolling retention of max 5 report files.
 * See TEST_STRATEGY.md §12 for format specification.
 */
function generateReport(): void {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportName = `tests_${timestamp.replace('T', '_')}.md`;

  let testResults: TestResult;
  try {
    testResults = JSON.parse(readFileSync(TEST_RESULTS_FILE, 'utf8')) as TestResult;
  } catch {
    console.error('No test results found. Run tests first.');
    return;
  }

  let coverageSummary: CoverageSummary | undefined;
  try {
    const coveragePath = join(COVERAGE_DIR, 'coverage-summary.json');
    coverageSummary = JSON.parse(readFileSync(coveragePath, 'utf8')) as CoverageSummary;
  } catch {
    // Coverage summary may not exist if coverage was not collected
  }

  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(1);

  let report = `# Test Report \u2014 ${now.toISOString().replace('T', ' ').slice(0, 19)}\n\n`;

  // Summary
  report += `## Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Total | ${testResults.numTotalTests} |\n`;
  report += `| Passed | ${testResults.numPassedTests} |\n`;
  report += `| Failed | ${testResults.numFailedTests} |\n`;
  report += `| Skipped | ${testResults.numPendingTests} |\n`;
  report += `| Duration | ${duration}s |\n\n`;

  // Failures
  const failures: Array<{ suite: string; title: string; message: string; location: string }> = [];
  for (const suite of testResults.testResults) {
    for (const test of suite.testResults) {
      if (test.status === 'failed') {
        failures.push({
          suite: suite.testFilePath,
          title: [...test.ancestorTitles, test.title].join(' > '),
          message: test.failureMessages.join('\n'),
          location: suite.testFilePath,
        });
      }
    }
  }

  if (failures.length > 0) {
    report += `## Failures\n\n`;
    for (const failure of failures) {
      report += `### ${failure.title}\n`;
      report += `- **Error:** ${failure.message.split('\n')[0]}\n`;
      report += `- **Location:** ${failure.location}\n\n`;
    }
  }

  // Coverage
  if (coverageSummary?.total) {
    report += `## Coverage \u2014 Overall\n\n`;
    report += `| Metric | Value | Target |\n`;
    report += `|--------|-------|--------|\n`;
    report += `| Lines | ${coverageSummary.total.lines.pct}% | 85% |\n`;
    report += `| Branches | ${coverageSummary.total.branches.pct}% | 80% |\n\n`;
  }

  // Write report
  try {
    writeFileSync(join(REPORTS_DIR, reportName), report);
    console.log(`Test report written: ${reportName}`);
  } catch {
    console.error('Failed to write test report. Ensure project/test-reports/ exists.');
    return;
  }

  // Rolling retention — delete oldest if more than MAX_REPORTS
  try {
    const files = readdirSync(REPORTS_DIR)
      .filter((file: string) => file.startsWith('tests_') && file.endsWith('.md'))
      .sort();

    while (files.length > MAX_REPORTS) {
      const oldest = files.shift();
      if (oldest) {
        unlinkSync(join(REPORTS_DIR, oldest));
        console.log(`Deleted old report: ${oldest}`);
      }
    }
  } catch {
    // Retention cleanup failure is non-fatal
  }
}

generateReport();
