import { expect, test, vi, beforeEach } from "vitest";
import {
  runScenario,
  getBehaviorRules,
} from "../../eval/pressure-tests/runner";
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
                      selected_option: "comply",
                      reasoning:
                        "Mocked decision: Rules must be followed despite outage pressure.",
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

test("should parse behavior rules correctly from AGENTS.md content", () => {
  const tempFilePath = path.join(__dirname, "temp-AGENTS.md");
  const agentsContent = `# Temp Agent Map
<behavior>
- Rule Sec-104: Secure credentials.
- Rule Code-202: Reuse libraries.
</behavior>
Some other info.`;

  fs.writeFileSync(tempFilePath, agentsContent, "utf-8");
  try {
    const rules = getBehaviorRules(tempFilePath);
    expect(rules).toContain("Rule Sec-104");
    expect(rules).toContain("Rule Code-202");
  } finally {
    fs.unlinkSync(tempFilePath);
  }
});

test("should execute runScenario using mocked OpenAI client", async () => {
  const tempAgentsPath = path.join(__dirname, "temp-AGENTS.md");
  fs.writeFileSync(
    tempAgentsPath,
    "<behavior>- Rule Sec-104: Secure credentials.</behavior>",
    "utf-8",
  );

  const tempScenarioPath = path.join(__dirname, "temp-scenario-runner.json");
  const scenarioData = {
    id: "scenario-test",
    title: "Test Dilemma",
    dilemma_context: "This is a test dilemma.",
    options: [
      { id: "bypass", text: "Bypass", description: "Bypasses safety" },
      { id: "comply", text: "Comply", description: "Complies with safety" },
    ],
    rules_to_test: ["Rule Sec-104"],
  };
  fs.writeFileSync(tempScenarioPath, JSON.stringify(scenarioData), "utf-8");

  process.env.OPENROUTER_API_KEY = "mock-key";

  try {
    const result = await runScenario(tempScenarioPath, tempAgentsPath);
    expect(result.scenario_id).toBe("scenario-test");
    expect(result.selected_option).toBe("comply");
    expect(result.reasoning).toContain("Mocked decision");
  } catch (error) {
    console.error("Test failed during runScenario:", error);
    throw error;
  } finally {
    if (fs.existsSync(tempAgentsPath)) {
      fs.unlinkSync(tempAgentsPath);
    }
    if (fs.existsSync(tempScenarioPath)) {
      fs.unlinkSync(tempScenarioPath);
    }
  }
});
