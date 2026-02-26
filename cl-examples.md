# Computation Layer — Forum example code

**Purpose:** Real CL code snippets from the [Computation Layer Support Forum](https://cl.desmos.com/c/examples/8) examples. Use these as patterns when generating code; match their structure and syntax.

**Source:** Scraped from forum example topics. Re-run `node scrape-examples.js` to refresh.

---

## Example snippets

```
label:
when numericValue("(-1)^{${this.pressCount}}") = 1 “Show”
otherwise “Hide”

---

hidden: numericValue("(-1)^{${showHide.pressCount}}")=(1)

---

label:
when numericValue("(-1)^{${this.pressCount}}") = 1 “Hide”
otherwise “Show”

---

hidden: numericValue("(-1)^{${showHide.pressCount}}")=(-1)

---

hidden: numericValue("\mod(${p},2)")=0

---

content: when choice.isSelected(1) and button.timeSincePress>0 "That's correct!"
when not(choice.isSelected(1)) and button.timeSincePress>0 "Please try again."
otherwise "Please make a selection."

---

# Aggregate all student responses on a new slide (Slide 2 graph CL)
# Slide 1: graph named graph1 with e.g. variable a. Slide 2: graph with this CL (use expression, not numberList):
number("a"): graph1.number("a")
L = aggregate(graph1.number("a"))
listLatex = `[${L.reduce("", (acc, cur) => when(acc = "", `${cur}`, `${acc},${cur}`))}]`
expression("a_{class}"): listLatex
```
