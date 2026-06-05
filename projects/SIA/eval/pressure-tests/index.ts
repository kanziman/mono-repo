import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { runScenario } from "./runner.js";
import { evaluateResult } from "./evaluator.js";
import { tuneRules } from "./self-tuner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const scenarioArg = process.argv[2];
    if (!scenarioArg) {
      console.error("Error: Please provide a scenario JSON path or file name.");
      console.error(
        "Usage: npm run eval:pressure <path_to_scenario.json> [model_name]",
      );
      process.exit(1);
    }

    const scenarioPath = path.resolve(scenarioArg);
    if (!fs.existsSync(scenarioPath)) {
      console.error(`Error: Scenario file not found at: ${scenarioPath}`);
      process.exit(1);
    }

    const modelArg =
      process.argv[3] ||
      process.env.PRESSURE_TEST_MODEL ||
      "openai/gpt-oss-120b:free";
    const agentsMdPath = path.resolve(__dirname, "../../AGENTS.md");

    console.log("=========================================");
    console.log("🔥 STARTING SIA PRESSURE TEST PIPELINE");
    console.log(`Scenario: ${scenarioPath}`);
    console.log(`Agent Rules: ${agentsMdPath}`);
    console.log(`Model: ${modelArg}`);
    console.log("=========================================\n");

    console.log("1. Running scenario simulation with agent...");
    const runResult = await runScenario(scenarioPath, agentsMdPath, modelArg);
    console.log(`- Selected Option: ${runResult.selected_option}`);
    console.log(
      `- Reasoning Summary: ${runResult.reasoning.substring(0, 100)}...\n`,
    );

    console.log("2. Evaluating agent decision with judge...");
    const evaluation = await evaluateResult(scenarioPath, runResult, modelArg);
    console.log(`- Score: ${evaluation.score} / 100`);
    console.log(`- Status: ${evaluation.passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`- Report saved to: ${evaluation.report_path}\n`);

    if (!evaluation.passed) {
      console.log("3. Initiating Self-Tuning process...");
      const scenarioRaw = fs.readFileSync(scenarioPath, "utf-8");
      const scenario = JSON.parse(scenarioRaw);
      const tuned = await tuneRules(
        evaluation,
        agentsMdPath,
        scenario.dilemma_context,
        scenario.rules_to_test,
        runResult.selected_option,
        modelArg,
      );
      if (tuned) {
        console.log(
          "🎉 Self-Tuning completed successfully. AGENTS.md behavior rules updated.",
        );
      } else {
        console.log("⚠️ Self-Tuning skipped or failed.");
      }
    } else {
      console.log(
        "3. Agent complies with safety rules. No rule tuning required.",
      );
    }

    console.log("\n=========================================");
    console.log("🏁 SIA PRESSURE TEST PIPELINE FINISHED");
    console.log("=========================================");
  } catch (error) {
    console.error("\n❌ Pipeline execution failed:", error);
    process.exit(1);
  }
}

main();
