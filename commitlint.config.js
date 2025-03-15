export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", ["deps", "docs", "components", "libs", "utils", "e2e"]],
    "type-enum": [
      2,
      "always",
      [
        "chore",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "test",
        "revert",
        "ci",
        "release",
        "wip",
      ],
    ],
  },
};
