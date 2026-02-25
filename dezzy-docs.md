**Purpose:** Reference for Dezzy to answer questions about the Activity Builder and to reference general Amplify/Desmos philosophy, products, and style. Use this file as context for LLM-generated output in the prompt box when a user uses the "Ask Dezzy" feature.

**Official Amplify Docs:**
- [Amplify Desmos Math information] (https://amplify.com/programs/amplify-desmos-math/)
- [Activity Builder reference] (https://service.amplify.com/article/amplify-classroom-getting-started-activity-builder)
- [Activity Builder component/graph help] (https://service.amplify.com/article/amplify-classroom-copy-individual-components-and-edit-graphs-in-activity-builder)
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

**Tip:** Give components clear names and use the CL Documentation reference in each CL scripting window to see what you can override (sinks) and what you can read (sources).