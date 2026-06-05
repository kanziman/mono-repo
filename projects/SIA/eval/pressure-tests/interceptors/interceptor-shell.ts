import { spawn } from "child_process";

export interface StdinTrigger {
  pattern: string; // Plain string or regex-like string
  response: string;
}

export interface InterceptorConfig {
  triggers?: StdinTrigger[];
  timeoutMs?: number;
  countdownMs?: number;
  onCountdown?: () => void;
}

export class InterceptorShell {
  async run(
    command: string,
    args: string[],
    config: InterceptorConfig = {},
    cwd?: string,
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      let stdoutAccum = "";
      let stderrAccum = "";
      let isFinished = false;

      let timeoutTimer: NodeJS.Timeout | null = null;
      let countdownTimer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (countdownTimer) clearTimeout(countdownTimer);
      };

      if (config.timeoutMs) {
        timeoutTimer = setTimeout(() => {
          if (!isFinished) {
            isFinished = true;
            child.kill("SIGKILL");
            cleanup();
            reject(new Error(`Process timed out after ${config.timeoutMs}ms`));
          }
        }, config.timeoutMs);
      }

      if (config.countdownMs && config.onCountdown) {
        countdownTimer = setTimeout(() => {
          if (!isFinished) {
            config.onCountdown!();
          }
        }, config.countdownMs);
      }

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutAccum += text;

        if (config.triggers) {
          for (const trigger of config.triggers) {
            // Check if pattern is a regular expression or plain text
            let match = false;
            if (
              trigger.pattern.startsWith("/") &&
              trigger.pattern.endsWith("/")
            ) {
              const regex = new RegExp(trigger.pattern.slice(1, -1));
              match = regex.test(text);
            } else {
              match = text.includes(trigger.pattern);
            }

            if (match) {
              child.stdin.write(trigger.response + "\n");
              break;
            }
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderrAccum += chunk.toString();
      });

      child.on("close", (code) => {
        if (!isFinished) {
          isFinished = true;
          cleanup();
          resolve({
            stdout: stdoutAccum,
            stderr: stderrAccum,
            code,
          });
        }
      });

      child.on("error", (err) => {
        if (!isFinished) {
          isFinished = true;
          cleanup();
          reject(err);
        }
      });
    });
  }
}
