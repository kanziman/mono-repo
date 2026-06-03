import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const designSystemPlugin = {
  rules: {
    "no-hardcoded-colors": {
      meta: {
        type: "problem",
        docs: {
          description: "Prevent hardcoded colors in className and inline styles",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === "className" && node.value) {
              let value = "";
              if (node.value.type === "Literal") {
                value = node.value.value;
              } else if (
                node.value.type === "JSXExpressionContainer" &&
                node.value.expression.type === "TemplateLiteral"
              ) {
                value = node.value.expression.quasis.map((q) => q.value.raw).join(" ");
              } else if (
                node.value.type === "JSXExpressionContainer" &&
                node.value.expression.type === "Literal"
              ) {
                value = node.value.expression.value;
              }

              if (typeof value === "string") {
                // Tailwind 원시 색상 클래스 검출 정규식
                const hardcodedColorRegex = /\b(bg|text|border|outline|ring|divide|placeholder)-(red|blue|green|yellow|purple|pink|indigo|teal|orange|amber|lime|emerald|cyan|sky|violet|fuchsia|rose|slate|gray|zinc|neutral|stone|black|white)-[0-9]+\b/;
                const match = value.match(hardcodedColorRegex);
                if (match) {
                  context.report({
                    node,
                    message: `[Design System Violation] 하드코딩된 Tailwind 색상 클래스 "${match[0]}" 대신 시맨틱 디자인 토큰을 활용하십시오. (do.md / dont.md 참조)`,
                  });
                }
              }
            }

            if (
              node.name.name === "style" &&
              node.value &&
              node.value.type === "JSXExpressionContainer" &&
              node.value.expression.type === "ObjectExpression"
            ) {
              node.value.expression.properties.forEach((prop) => {
                if (
                  prop.type === "Property" &&
                  prop.key &&
                  prop.key.type === "Identifier" &&
                  ["color", "backgroundColor", "borderColor", "outlineColor"].includes(prop.key.name)
                ) {
                  if (prop.value && prop.value.type === "Literal") {
                    const val = prop.value.value;
                    if (
                      typeof val === "string" &&
                      (val.startsWith("#") ||
                        val.startsWith("rgb") ||
                        val.startsWith("hsl") ||
                        ["red", "blue", "green", "white", "black", "gray"].includes(val.toLowerCase()))
                    ) {
                      context.report({
                        node: prop.value,
                        message: `[Design System Violation] 인라인 스타일에 하드코딩된 색상 "${val}" 직접 대입 대신 시맨틱 디자인 토큰 또는 CSS 변수를 사용하십시오. (do.md / dont.md 참조)`,
                      });
                    }
                  }
                }
              });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    plugins: {
      "design-system": designSystemPlugin,
    },
    rules: {
      "design-system/no-hardcoded-colors": "error",
    },
  },
];

export default eslintConfig;
