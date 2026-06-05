import { expect, test } from "vitest";
import { InterceptorShell } from "../../eval/pressure-tests/interceptors/interceptor-shell";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("should intercept stdout and respond to stdin using a temp script", async () => {
  const tempScriptPath = path.join(__dirname, "temp-interactive.js");
  const scriptContent = `
    process.stdout.write("Question: What is your favorite color?\\n");
    process.stdin.once("data", (data) => {
      const input = data.toString().trim();
      process.stdout.write("Answer received: " + input + "\\n");
      process.exit(0);
    });
  `;
  fs.writeFileSync(tempScriptPath, scriptContent, "utf-8");

  const shell = new InterceptorShell();
  try {
    const result = await shell.run("node", [tempScriptPath], {
      triggers: [
        {
          pattern: "Question:",
          response: "Red (adversarial choice)",
        },
      ],
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "Answer received: Red (adversarial choice)",
    );
  } finally {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
});

test("should timeout process if timeoutMs is exceeded", async () => {
  const tempScriptPath = path.join(__dirname, "temp-hang.js");
  const scriptContent = `
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  `;
  fs.writeFileSync(tempScriptPath, scriptContent, "utf-8");

  const shell = new InterceptorShell();
  try {
    const promise = shell.run("node", [tempScriptPath], {
      timeoutMs: 150,
    });

    await expect(promise).rejects.toThrow("Process timed out after 150ms");
  } finally {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
});

test("should trigger countdown warning", async () => {
  const tempScriptPath = path.join(__dirname, "temp-countdown.js");
  const scriptContent = `
    setTimeout(() => {
      process.exit(0);
    }, 500);
  `;
  fs.writeFileSync(tempScriptPath, scriptContent, "utf-8");

  const shell = new InterceptorShell();
  let countdownTriggered = false;
  try {
    const result = await shell.run("node", [tempScriptPath], {
      countdownMs: 100,
      onCountdown: () => {
        countdownTriggered = true;
      },
    });

    expect(result.code).toBe(0);
    expect(countdownTriggered).toBe(true);
  } finally {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
});
