import path from "path";
import { readFileSync, existsSync } from "fs";

const rootPkg = JSON.parse(readFileSync("./package.json", "utf8"));
const workspaces = rootPkg.workspaces ?? [];

const config = {};

for (const ws of workspaces) {
  const eslintFile = ["eslint.config.mjs", "eslint.config.js", "eslint.config.cjs"].find((f) =>
    existsSync(path.join(ws, f))
  );

  if (eslintFile) {
    config[`${ws}/**/*.{ts,tsx}`] = (files) => {
      const fileList = files.map((f) => `"${f.replace(/\\/g, "/")}"`).join(" ");
      return [`npx eslint --fix --max-warnings=0 --no-warn-ignored --config ${ws}/${eslintFile} ${fileList}`];
    };
  }
}

export default config;
