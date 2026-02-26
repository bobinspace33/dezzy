**Purpose:** Reference for Dezzy to answer questions about the Activity Builder and to reference general Amplify/Desmos philosophy, products, and style. Use this file as context for LLM-generated output in the prompt box when a user uses the "Ask Dezzy" feature.

**Official Amplify Docs:**
- [Amplify Desmos Math information] (https://amplify.com/programs/amplify-desmos-math/)
- [Activity Builder reference] (https://service.amplify.com/article/amplify-classroom-getting-started-activity-builder)
- [Activity Builder component/graph help] (https://service.amplify.com/article/amplify-classroom-copy-individual-components-and-edit-graphs-in-activity-builder)
- [Computation Layer Documentation](https://classroom.amplify.com/computation-layer/documentation) — use current sinks/sources and types here; avoid deprecated functions (see [Deprecated Functions](https://classroom.amplify.com/computation-layer/documentation#deprecated-functions) for replacements).
- [Computation Layer Support Forum] (https://cl.desmos.com/)

## Resources / Articles (Forum)

- [Computation Layer 101](https://cl.desmos.com/t/computation-layer-101/8414)
- [List Functions in CL](https://cl.desmos.com/t/list-functions-in-cl/7353)
- [Animations and Parametric Curves](https://cl.desmos.com/t/animations-and-parametric-curves/8150)
- [numericValue vs simpleFunction](https://cl.desmos.com/t/numericvalue-vs-simplefunction/5528)
- [Sketch / Save This Snippet / Sketch Inside The Lines](https://cl.desmos.com/c/resources/articles/12) — various sketch and transformation articles

---

## Computation Layer 101 (Summary)

CL is the connective layer in Activity Builder. It **overrides** what you set during authoring: note content, graph variables, hidden state, etc. Overrides are called **sinks**.

### Override examples

- Note content: `content: "Hello World"`
- Graph variable: `number("A"): 5`
- Hide component: `hidden: true`

### Where overrides come from

You can hard-code values or use information from **other components**. To use another component’s data you need:
1. What information you want (e.g. latex, submission count).
2. Where it comes from (component **name**).

**Tip:** Give components clear names and use the CL Documentation reference in each CL scripting window to see what you can override (sinks) and what you can read (sources). The component for entering math/expressions is called **Math Response** (formerly Math Input). There is no separate slider component — sliders are made with the graph component (e.g. graph variable with slider; reference in CL via graph1.number("a")). For random numbers use **randomGenerator** (e.g. `r = randomGenerator()` then `r.int(-9, 9)` or `r.float(0, 1)`), not randomInteger. For **table columns** use `table1.columnNumericValues(1)` (column index), not `table.column("")`. **numberList** is no longer a valid sink. To set a list in the graph use **expression** with list literal latex: L = aggregate(...), listLatex = \`[\${L.reduce("", (acc, cur) => when(acc = "", \`\${cur}\`, \`\${acc},\${cur}\`))}]\` (template literals only, no +), expression("a_{class}"): listLatex. In slide CL use component names only (e.g. table1, note1), not slide1.table1. There is no **zip** in CL; pair lists by index with `range(length(L)).map((i) => ...)` and `L.elementAt(i)`, `M.elementAt(i)`. There is no **countBy**; use reduce or filter+length to count by value. Use a space in arrow params: `(el, i) =>` not `(el,i) =>` to avoid "expected =>" errors. **list.join** only concatenates two lists; to build a string from a list of strings use **reduce** (e.g. `list.reduce("", (acc, cur) => when(acc = "", cur, acc + ", " + cur))`). For **mean of a list**, there is no mean() in CL script — use sum via list.reduce(0, (acc, cur) => numericValue(\`${acc}+${cur}\`)), n = length(L), then meanVal = numericValue(\`\\frac{${sumVal}}{${n}}\`) (guard against n=0). **Arithmetic with variables:** CL does not evaluate infix like `target = 500 + 100*randNum`. Use `target = numericValue(\`500+100*${randNum}\`)` or `f = simpleFunction("500+100*x", "x")` then `target = f.evaluateAt(randNum)`. **Top-level rule:** Every top-level line in CL must be either a variable assignment (`name = expression`) or a sink assignment (`sinkName: value`). Bare expressions or standalone `when(...)` cause "toplevel declarations must be variable or sink assignments" errors — use `content: when(...)` or `x = when(...)` then `content: x`.