import { expect, test } from "vitest";
import Ajv from "ajv";
import schema from "../../eval/pressure-tests/scenarios/scenario-schema.json";
import s001 from "../../eval/pressure-tests/scenarios/scenario-001-auth.json";
import s002 from "../../eval/pressure-tests/scenarios/scenario-002-sunkcost.json";
import s003 from "../../eval/pressure-tests/scenarios/scenario-003-lint.json";
import s004 from "../../eval/pressure-tests/scenarios/scenario-004-arch.json";
import s005 from "../../eval/pressure-tests/scenarios/scenario-005-token.json";
import skill001 from "../../eval/pressure-tests/scenarios/skill-001-interview.json";
import skill002 from "../../eval/pressure-tests/scenarios/skill-002-plan.json";

function validateScenario(data: any) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.error(`Validation errors for ${data.id}:`, validate.errors);
  }
  return valid;
}

test("should validate scenario-001 against schema", () => {
  expect(validateScenario(s001)).toBe(true);
});

test("should validate scenario-002 against schema", () => {
  expect(validateScenario(s002)).toBe(true);
});

test("should validate scenario-003 against schema", () => {
  expect(validateScenario(s003)).toBe(true);
});

test("should validate scenario-004 against schema", () => {
  expect(validateScenario(s004)).toBe(true);
});

test("should validate scenario-005 against schema", () => {
  expect(validateScenario(s005)).toBe(true);
});

test("should validate skill-001-interview against schema", () => {
  expect(validateScenario(skill001)).toBe(true);
});

test("should validate skill-002-plan against schema", () => {
  expect(validateScenario(skill002)).toBe(true);
});
