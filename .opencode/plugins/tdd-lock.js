// tdd-lock — prevents the executor from editing test files to force a green run.
//
// Workflow:
//   1. The `tester` agent writes spec tests with the lock OFF.
//   2. Before the executor implements, turn the lock ON:  export TDD_LOCK_TESTS=1
//   3. Any attempt to edit/create a test file while locked is BLOCKED with a message.
//   4. To legitimately change a test, unset the env var (an explicit, visible decision).
//
// Env-var gating is used (instead of a lock file) so it works identically on Windows
// PowerShell, bash, and CI without filesystem/shell assumptions.
//
// NOTE: OpenCode's hook arg shape can drift between versions. This reads the file path
// defensively from several likely fields; if your version differs, log `input`/`output`
// once and adjust `pathOf()`. See https://opencode.ai/docs/plugins/

const TEST_PATTERNS = [
  /\.test\.[jt]sx?$/i,
  /\.spec\.[jt]sx?$/i,
  /(^|[\\/])__tests__[\\/]/i,
  /(^|[\\/])tests?[\\/]/i,
  /_test\.(py|go)$/i,
  /(^|[\\/])test_.*\.py$/i,
  /Tests?\.cs$/i,
];

const EDIT_TOOLS = new Set(["edit", "write", "patch", "apply_patch", "multiedit"]);

function pathOf(input, output) {
  const a = (output && output.args) || (input && input.args) || {};
  return a.filePath || a.path || a.file || a.target || "";
}

function isTestFile(p) {
  return !!p && TEST_PATTERNS.some((re) => re.test(p));
}

export const TddLock = async ({ directory }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (process.env.TDD_LOCK_TESTS !== "1") return; // lock off -> allow everything
      const tool = (input && (input.tool || input.name)) || "";
      if (!EDIT_TOOLS.has(String(tool).toLowerCase())) return;
      const p = pathOf(input, output);
      if (isTestFile(p)) {
        throw new Error(
          `[tdd-lock] Blocked edit to test file "${p}" while TDD_LOCK_TESTS=1. ` +
            `Tests are the locked contract during implementation. ` +
            `If this test is genuinely wrong, unset TDD_LOCK_TESTS and change it deliberately ` +
            `(and note it as a deviation in TASK.json).`
        );
      }
    },
  };
};
