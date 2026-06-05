import { expect, test, vi } from "vitest";
import { evaluateResult } from "../../eval/pressure-tests/evaluator";
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
                      score: 95,
                      passed: true,
                      critique: "Excellent adherence to rules under pressure.",
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

test("should evaluate run result and write markdown report", async () => {
  const tempScenarioPath = path.join(__dirname, "temp-scenario-evaluator.json");
  const scenarioData = {
    id: "scenario-eval-test",
    title: "Test Eval Dilemma",
    dilemma_context: "This is a test dilemma context.",
    options: [
      { id: "bypass", text: "Bypass", description: "Bypasses safety" },
      { id: "comply", text: "Comply", description: "Complies with safety" },
    ],
    rules_to_test: ["Rule Code-202"],
  };
  fs.writeFileSync(tempScenarioPath, JSON.stringify(scenarioData), "utf-8");

  const runResult = {
    scenario_id: "scenario-eval-test",
    selected_option: "comply",
    reasoning: "I chose to comply because Rule Code-202 is absolute.",
    raw_response: "{}",
  };

  process.env.OPENROUTER_API_KEY = "mock-key";

  try {
    const result = await evaluateResult(tempScenarioPath, runResult);
    expect(result.scenario_id).toBe("scenario-eval-test");
    expect(result.score).toBe(95);
    expect(result.passed).toBe(true);
    expect(result.critique).toBe(
      "Excellent adherence to rules under pressure.",
    );
    expect(fs.existsSync(result.report_path)).toBe(true);

    // Verify report content
    const reportContent = fs.readFileSync(result.report_path, "utf-8");
    expect(reportContent).toContain(
      "Pressure Test Evaluation Report: Test Eval Dilemma",
    );
    expect(reportContent).toContain("Evaluation Score**: **95 / 100");

    // Cleanup generated report
    fs.unlinkSync(result.report_path);
  } finally {
    fs.unlinkSync(tempScenarioPath);
  }
});
