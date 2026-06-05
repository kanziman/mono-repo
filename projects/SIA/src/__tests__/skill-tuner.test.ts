import { expect, test, vi } from "vitest";
import { tuneSkillPrompt } from "../../eval/pressure-tests/skill-tuner";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock OpenAI
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: `---
name: zb-goal-interview
---
# zb-goal-interview
## 🛠️ 핵심 동작 규칙 (Core Guidelines)
- Rule 1: Updated and strengthened guideline.
- Rule 2: Impatient client rule.
`,
                  },
                },
              ],
            }),
          },
        },
      };
    }),
  };
});

test("should skip tuning if evaluation score is >= 85", async () => {
  const tempSkillsDir = path.join(__dirname, "temp-skills");
  const skillDir = path.join(tempSkillsDir, "zb-goal-interview");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "original-content",
    "utf-8",
  );

  process.env.OPENROUTER_API_KEY = "mock-key";

  try {
    const result = await tuneSkillPrompt(
      "zb-goal-interview",
      {
        scenario_id: "zb-goal-interview",
        score: 90,
        passed: true,
        critique: "Great job",
        report_path: "mock-report-path",
      },
      tempSkillsDir,
    );

    expect(result).toBe(false);
    expect(fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8")).toBe(
      "original-content",
    );
  } finally {
    fs.rmSync(tempSkillsDir, { recursive: true, force: true });
  }
});

test("should perform tuning if evaluation score is < 85", async () => {
  const tempSkillsDir = path.join(__dirname, "temp-skills-2");
  const skillDir = path.join(tempSkillsDir, "zb-goal-interview");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "original-content",
    "utf-8",
  );

  process.env.OPENROUTER_API_KEY = "mock-key";

  try {
    const result = await tuneSkillPrompt(
      "zb-goal-interview",
      {
        scenario_id: "zb-goal-interview",
        score: 75,
        passed: false,
        critique: "Compromised on requirements under client pressure.",
        report_path: "mock-report-path",
      },
      tempSkillsDir,
    );

    expect(result).toBe(true);
    const updatedContent = fs.readFileSync(
      path.join(skillDir, "SKILL.md"),
      "utf-8",
    );
    expect(updatedContent).toContain("Updated and strengthened guideline.");
    expect(updatedContent).toContain("Impatient client rule.");
  } finally {
    fs.rmSync(tempSkillsDir, { recursive: true, force: true });
  }
});
