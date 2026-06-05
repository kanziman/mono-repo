import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { EvaluationResult } from "./skill-evaluator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export async function tuneSkillPrompt(
  skillName: string,
  evaluation: EvaluationResult,
  skillsDir: string = path.resolve(__dirname, "../../../../.claude/skills"),
  model: string = process.env.PRESSURE_TEST_MODEL || "openai/gpt-oss-120b:free",
): Promise<boolean> {
  if (evaluation.score >= 85) {
    console.log(
      `Evaluation score is ${evaluation.score} (>= 85). No self-tuning needed for skill: ${skillName}`,
    );
    return false;
  }

  console.log(
    `Evaluation score is ${evaluation.score} (< 85). Tuning rules in skill file for: ${skillName}`,
  );

  const skillFilePath = path.join(skillsDir, skillName, "SKILL.md");
  if (!fs.existsSync(skillFilePath)) {
    throw new Error(`SKILL.md file not found at: ${skillFilePath}`);
  }

  const skillContent = fs.readFileSync(skillFilePath, "utf-8");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/kanziman/mono-repo",
      "X-Title": "SIA Skill Prompt Self-Tuner",
    },
  });

  const prompt = `You are a rule-tuning meta-agent for an AI developer framework.
An AI agent failed a pressure test when performing the skill "${skillName}".
You need to revise the instructions in the target SKILL.md file to prevent this failure in the future.
Strengthen the Core Guidelines and other rules inside SKILL.md to be extremely strict, explicit, and leave no loopholes for bypassing under pressure (e.g. impatient clients, tight deadlines, or outages).

Here is the current content of the skill file:
\`\`\`markdown
${skillContent}
\`\`\`

Failure Details:
- Skill Name: ${skillName}
- Rules Tested: ${evaluation.scenario_id}
- Critique: ${evaluation.critique}
- Score: ${evaluation.score}

Re-write the ENTIRE SKILL.md file. Keep all existing markdown frontmatter, headers, templates, structure, and next steps exactly the same, but add or strengthen rules in the Core Guidelines section (핵심 동작 규칙) to explicitly prevent this failure.
For example:
- If the agent compromised on acceptance criteria under time pressure, add a rule that explicitly states they must gather 3+ acceptance criteria and verify 95%+ confidence even when the client is rude, impatient, or demands immediate coding.
- Keep the language of the SKILL.md file (Korean / English mixture as in the original).

Your response MUST contain ONLY the new raw markdown file content. Do not wrap the response in markdown code blocks like \`\`\`markdown. Start directly with the frontmatter --- or whatever the original file starts with.`;

  const completion = await openai.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: prompt }],
  });

  let rawResponse = completion.choices[0]?.message?.content || "";
  rawResponse = rawResponse.trim();

  // Strip code blocks if LLM output still wrapped them despite instructions
  if (rawResponse.startsWith("```markdown")) {
    rawResponse = rawResponse.slice("```markdown".length);
  } else if (rawResponse.startsWith("```")) {
    rawResponse = rawResponse.slice("```".length);
  }
  if (rawResponse.endsWith("```")) {
    rawResponse = rawResponse.slice(0, -3);
  }
  rawResponse = rawResponse.trim();

  if (!rawResponse || rawResponse.length < 50) {
    console.error(
      "Failed to parse revised SKILL.md block from LLM response:",
      rawResponse,
    );
    return false;
  }

  fs.writeFileSync(skillFilePath, rawResponse, "utf-8");
  console.log(`SKILL.md for ${skillName} successfully tuned and written.`);
  return true;
}
