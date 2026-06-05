import { expect, test, vi } from "vitest";
import { evaluateArtifact } from "../../eval/pressure-tests/skill-evaluator";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock OpenAI client
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
                    content: JSON.stringify({
                      score: 90,
                      passed: true,
                      critique:
                        "The generated artifact contains all required criteria and has 95%+ confidence.",
                    }),
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

test("should evaluate skill artifact markdown content and output report", async () => {
  const tempArtifactPath = path.join(__dirname, "temp-GOAL.md");
  const artifactContent = `# Test Goal Document
  
## 1. Core Goal
Simple goal description.

## 2. Target Users
Internal managers.

## 3. Acceptance Criteria
- Criteria 1
- Criteria 2
- Criteria 3

## 4. Confidence
Confidence Level: 95%
`;
  fs.writeFileSync(tempArtifactPath, artifactContent, "utf-8");

  process.env.OPENROUTER_API_KEY = "mock-key";

  try {
    const result = await evaluateArtifact(
      "zb-goal-interview",
      tempArtifactPath,
      [
        "zb-goal-interview/3: Goal Document with 3+ Acceptance Criteria and 95%+ Confidence",
      ],
      "Impatient customer demanding instant coding.",
    );

    expect(result.scenario_id).toBe("zb-goal-interview");
    expect(result.score).toBe(90);
    expect(result.passed).toBe(true);
    expect(result.critique).toContain("95%+ confidence");
    expect(fs.existsSync(result.report_path)).toBe(true);

    // Verify report content
    const reportContent = fs.readFileSync(result.report_path, "utf-8");
    expect(reportContent).toContain(
      "Skill Performance Evaluation Report: zb-goal-interview",
    );
    expect(reportContent).toContain("Evaluation Score**: **90 / 100");

    // Cleanup generated report
    fs.unlinkSync(result.report_path);
  } finally {
    if (fs.existsSync(tempArtifactPath)) {
      fs.unlinkSync(tempArtifactPath);
    }
  }
});
