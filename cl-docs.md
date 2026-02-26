# Computation Layer (CL) Documentation

**Purpose:** Reference for Amplify Desmos Activity Builder Computation Layer. Use this file as context for LLM-generated CL code. **Generated code must use only sinks, sources, and syntax described in this document** — no invented or undocumented APIs.

**Official docs (content loads via JavaScript; open in a browser to view full reference):**
- [Computation Layer Documentation](https://classroom.amplify.com/computation-layer/documentation)
- [Components](https://classroom.amplify.com/computation-layer/documentation#components)
- [teacher.desmos.com/computation-layer/documentation](https://teacher.desmos.com/computation-layer/documentation)

**Community:** [Computation Layer Support Forum](https://cl.desmos.com/) — [Questions](https://cl.desmos.com/c/questions/5) · [Examples](https://cl.desmos.com/c/examples/8) · [Resources/Articles](https://cl.desmos.com/c/resources/articles/12)

**Deprecations and keeping docs current:** Some CL functions have been deprecated in favor of newer APIs (e.g. `sketchStrokeCount` → `sketch.strokeCount`, `angleOfLine` → `line.angle`, `bounds.setStrategy` → `bounds.METHODNAME`, **`randomInteger` → `randomGenerator`**). For random numbers use `randomGenerator()` and then `r.int(min, max)` or `r.float(min, max)` (e.g. `r = randomGenerator()` then `number("a"): r.int(-9, 9)`). Do not use `randomInteger`. **Mean of a list:** There is no `mean(list)` in CL script; compute mean as sum ÷ length using `list.reduce` for sum, `length(list)` for count, then `numericValue` with `\frac{sum}{n}` (see "Mean of a list" under List functions). This file includes a scraped **Deprecated Functions** section (search for "Deprecated Functions" or "deprecated-functions"); use the replacements listed there when generating code. For the most up-to-date list, run `node scrape-docs.js` to re-scrape the official docs, or check [Amplify CL documentation – Deprecated Functions](https://classroom.amplify.com/computation-layer/documentation#deprecated-functions) in a browser.

**Sliders:** There is no longer a separate "slider" component. Sliders are created using the **graph component**: add a Graph component, then in the graph add a variable (e.g. `a`) and use the graph’s slider/parameter UI. Control or read the value from CL via the graph’s `number("a")` (and related graph sinks/sources). All slider behavior and CL references use the graph component.

**Math Response:** The component for entering math or expressions is now called **Math Response** (formerly "Math Input" or "expression input"). In CL and docs you may still see references to "expression input"; treat them as Math Response. Use the same sinks/sources (e.g. `numericValue`, `latex`, `submitted`).

**Top-level rule (required):** Every top-level line in a CL script must be either a **variable assignment** (`name = expression`) or a **sink assignment** (`sinkName: value`). Do not write bare expressions or standalone function calls at the top level — they cause "toplevel declarations must be variable or sink assignments" errors. Use `when`/`otherwise` only as the right-hand side of a variable or a sink (e.g. `content: when(...) ... otherwise ...` or `feedback = when(...) ... otherwise ...` then `content: feedback`).

---

## Resources / Articles (Forum)

- [Computation Layer 101](https://cl.desmos.com/t/computation-layer-101/8414)
- [List Functions in CL](https://cl.desmos.com/t/list-functions-in-cl/7353)
- [CL Newsletter, July 2021 – Aggregating Responses](https://cl.desmos.com/t/cl-newsletter-july-2021-aggregating-responses/5462) — using `aggregate` to show class data
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

### Conditional statements: `when` / `otherwise`

- `when(condition, valueIfTrue)` and `otherwise(defaultValue)`.
- Like if/else: you can have multiple `when` clauses; one `otherwise` at the end.
- Example: show different note text when an input is submitted vs not.

### Same-component reference: `this`

When the override is in the same component you’re reading from, use `this` instead of the component name (so renaming the component doesn’t break the reference).

### Boolean sinks shortcut

For true/false sinks, you can often give just the condition for “true”; you don’t always need full `when`/`otherwise`. Example: disable input after one submission by overriding the “can submit” sink with a condition on submission count.

### Captures and variables

- **Capture:** store a submitted/captured value and give it a name.
- **Variable** in CL uses `=` (e.g. `previous = ...`). It’s different from a sink, which uses `:`.
- You can read from **capture history** (e.g. last value, value before last) to compare previous vs current answers (e.g. “warmer” / “colder”).

### Example: overriding note with Math Response value

1. Name the Math Response component (e.g. `input1`).
2. In a note’s CL: set `content` to the component’s latex source (e.g. `input1.latex` or the appropriate source from the doc).
3. Optionally use `when`/`otherwise` to show different content before/after submission.

### Example: disabling the Math Response after one submission

In the Math Response component’s CL, find the sink that controls whether the student can submit again (e.g. “submissions” or “disabled”); override it with a condition on the number of submissions (e.g. `when(this.submissionCount > 0, false, true)` or the boolean shortcut).

---

## Show/Hide a component

Toggle visibility with a button using `hidden` and `pressCount`.

**Button (name e.g. `showHide`):**
- Label: `when(numericValue("(-1)^{${this.pressCount}}") = 1, "Show", "Hide")` — starts with component hidden.
- To start with component shown: use `"Hide"` when expression = 1 and `"Show"` otherwise.

**Component to show/hide:**
- `hidden: numericValue("(-1)^{${showHide.pressCount}}") = (1)` — starts hidden.
- For starting visible then hide: `hidden: numericValue("(-1)^{${showHide.pressCount}}") = (-1)`.

**Alternative (mod for toggle):**  
`p = hint1.pressCount` and `hidden: numericValue("\\mod(${p},2)") = 0`. Mod lets you cycle through more than two states (e.g. mod 4 for four states).

### Arithmetic in numericValue() and LaTeX strings

The argument to `numericValue()` is a **LaTeX string**. Raw `-` and `/` can cause parsing issues. Use these forms instead:

- **Division:** Do **not** use a bare `/` for division in LaTeX strings. Use:
  - **Fraction:** `\frac{numerator}{denominator}` — e.g. `numericValue("\\frac{5}{13}")` or inside template literals `` numericValue(`\\frac{${a}}{${b}}`) ``. In double-quoted strings use double backslash: `"\\frac{3}{4}"`.
  - **Obelus (÷):** `\div` — e.g. `numericValue("10\\div2")`.
- **Subtraction:** Use the minus sign with clear operands; wrap in **parentheses** to avoid ambiguity (e.g. unary minus vs hyphen). Examples: `numericValue("${min(X)}-5")`, `numericValue("(-1)^{${n}}")`, or `` numericValue(`(${a})-(${b})`) `` for a minus b. If you get errors, try `` numericValue(`(${x})-(${y})`) `` so the minus is unambiguously binary subtraction.

**Summary:** In `numericValue(...)` use `\frac{}{}` or `\div` for division; use `-` for subtraction with parentheses around operands when needed.

**Arithmetic with variables (e.g. target = 500 + 100 * randNum):** CL does not evaluate infix expressions like `500 + 100 * randNum` as code. You must use one of these:

1. **numericValue with a template literal** — build a string and evaluate it:  
   `target = numericValue(\`500+100*${randNum}\`)`  
   Use `+`, `-`, `*` in the string; for division use `\\frac{${a}}{${b}}` or `\\div`. Parentheses help (e.g. `\`500+(100*${randNum})\``). Avoid using the letter `e` in the string for scientific notation (it is parsed as the constant e); use `10^{...}` or simpleFunction instead.

2. **simpleFunction** — for expressions with one or more variables, define a function and evaluate at values:  
   `f = simpleFunction("500+100*x", "x")`  
   `target = f.evaluateAt(randNum)`  
   For two variables: `prod = simpleFunction("x*y", "x", "y")` then `ans = prod.evaluateAt(2, G)`. Use LaTeX in the string (e.g. `\times` for multiply in some contexts).

So instead of `target = 500 + 100 * randNum`, write either  
`target = numericValue(\`500+100*${randNum}\`)`  
or  
`f = simpleFunction("500+100*x", "x")` and `target = f.evaluateAt(randNum)`.

---

## Working code examples (use these patterns)

These are minimal, copy-paste-ready CL patterns. Generate code that follows the same structure and only uses documented sinks/sources.

**1. Note showing Math Response value (component CL on the Note)**  
Name the Math Response component (e.g. `input1`). In the Note’s CL:
```
content: input1.latex
```
Or with a when/otherwise before vs after submit:
```
content: when input1.submitted input1.latex otherwise "Enter an expression above."
```

**2. Note with correctness feedback from another component**  
Name the Math Response component `exp1`. In a Note’s CL (screen or same screen):
```
feedback = when exp1.script.correct "That's correct!" otherwise "Not correct yet."
content: feedback
```
In exp1’s CL define correct and the correct sink:
```
correct = this.numericValue > 7
correct: correct
```

**3. Graph: correctness from a graph variable (e.g. slope m)**  
In the Graph component’s CL:
```
isCorrect = this.number("m") = 2
correct: isCorrect
```
(Use the graph to define a variable `m` and give it a slider so students can change it.)

**4. Action button: label changes with press count**  
In the button’s CL:
```
label: when this.pressCount = 0 "Start" otherwise "Press again"
```

**5. Hide a component until a button is pressed**  
Name the button `showBtn`. On the component you want to hide:
```
hidden: showBtn.pressCount < 1
```

**6. Graph number and point label from a Math Response**  
Name the Math Response component `exp1` and the graph `graph1`. In the graph’s CL:
```
number("n"): exp1.numericValue
pointLabel("A"): `n = ${exp1.numericValue}`
```

**7. Screen CL: note content from Math Response on same screen**  
Screen CL (script on the screen, not a component):
```
content: when input1.submitted input1.latex otherwise "Submit your answer."
```
(Assumes a note and Math Response on that screen; adjust component names.)

**8. Multiple choice + feedback note**  
Name the multiple choice `choice1` and a button `checkBtn`. In the feedback note’s CL:
```
content: when checkBtn.pressCount > 0 and choice1.isSelected(1) "Correct!" when checkBtn.pressCount > 0 "Try again." otherwise "Select an answer and press Check."
```

**9. Aggregate all student responses and show on a graph on a new slide**  
- **Slide 1:** Add a Graph component; name it `graph1`. Have students move a point or use a variable (e.g. create a point or variable named `a` in the graph). Optionally use a button with **capture** so you only aggregate after they submit.  
- **Slide 2:** Add a Graph component. In that graph’s CL, show the **current student’s** value and **everyone’s** values using `aggregate`:
```
# This student's value (from the graph on the previous slide)
number("a"): graph1.number("a")
# All students' values as a list (for plotting many points)
numberList("a_{class}"): aggregate(graph1.number("a"))
```
In the graph on Slide 2, add a plot that uses the list (e.g. points (a_class, 0) or a histogram). Use a lighter color/opacity for the class list so the current student’s point stands out. **Testing:** Aggregation often does not work in preview; create a class code and open the activity in two or more incognito windows as different “students” to test.

When generating code, prefer these patterns and the same component names (input1, note1, graph1, exp1, etc.) unless the user specifies otherwise. Refer to the math/expression component as **Math Response** in instructions. Every top-level line must be a variable assignment (=) or a sink assignment (:); no bare expressions.

---

## List functions in CL

Lists use brackets: `myNumbers = [5, 3.14, 2.71, 19, -3]`. You can have lists of numbers, strings, etc.

### Accessing elements

- `list.elementAt(1)` or `list[1]` (1-based index in the article examples).
- String interpolation: `"${myStrings[1]} ${myStrings[2]}"`.

### Arrow functions

Syntax: `(params) => expression`. Example: `(el) => el > 3`.

### List methods (overview)

- **map:** `[1,2,3,4,5].map((el) => el > 3)` → new list with function applied to each element.
- **filter:** `[1,2,3,4,5].filter((el) => el > 3)` → list of elements that pass the test.
- **first:** `[1,2,3,4,5].first((el) => el > 3)` → first element that passes.
- **all / any:** `list.any((el) => el > 0)`, `list.all((el) => el > 0)`.
- **range:** `range(10)` → [1..10]; `range(5, 7)` → [5,6,7]; `range(0, 100, 20)` → step 20.
- **slice:** `[1,2,3,4,5].slice(2, 4)` → subset (check doc for 1-based vs 0-based).
- **join:** `[1,2].join([3,4])` → [1,2,3,4].
- **reverse:** `[1,2,3].reverse()` → [3,2,1].
- **reduce:** `list.reduce(initialValue, (accumulator, current) => expression)` — e.g. sum: `numericValue(\`${accumulator}+${current}\`)`.

### Mean of a list (no mean() in CL script)

CL script does not provide a `mean(list)` function. Compute the mean as **sum ÷ length** using `list.reduce` for the sum and `length(list)` for the count, then divide with `numericValue` (use `\frac{}{}` for division). Example:

```
# Sum of the list (e.g. L from aggregate or a numberList)
sumVal = L.reduce(0, (acc, cur) => numericValue(`${acc}+${cur}`))
n = length(L)
# Mean; guard against empty list
meanVal = when n = 0 0 otherwise numericValue(`\frac{${sumVal}}{${n}}`)
content: "Class average: `${meanVal}`"
```

If the list is in a **graph** (e.g. `numberList("L"): aggregate(...)`), you can sometimes use the graph’s calculator (e.g. a line or label that references mean in the graph expression list), but in component or screen CL script use the reduce + length + numericValue pattern above.

*(List features may be preview; check official docs for current behavior.)*

---

## Aggregating responses (aggregate)

*Source: [CL Newsletter, July 2021 – Aggregating Responses](https://cl.desmos.com/t/cl-newsletter-july-2021-aggregating-responses/5462)*

The **aggregate** function retrieves the numeric response of **all students** in an activity. You can use any numeric value students enter or interact with: values in a table or Math Response, coordinates of points on a graph, etc. This makes it possible to show class data on a **later slide** (e.g. “see where everyone placed their point”) without opening the teacher dashboard.

### How to aggregate and show on a graph on a new slide

1. **Slide 1 (collection):** Add a **Graph** (or Math Response / table). Name the graph `graph1`. Have students interact (e.g. move a point, so the graph has a variable like `a`, or enter a value in a Math Response). The value you want from each student must be readable as a number (e.g. `graph1.number("a")` for a graph variable, or `input1.numericValue` for a Math Response).
2. **Slide 2 (display):** Add a **Graph**. In that graph’s **Computation Layer**, write:
   - **This student’s value:** `number("a"): graph1.number("a")` — pulls the current student’s value from the component on the previous slide (use the **component name** from Slide 1, e.g. `graph1`).
   - **All students’ values:** `numberList("a_{class}"): aggregate(graph1.number("a"))` — collects the same value from every student into a list.
3. **In the graph on Slide 2:** Use the list to plot (e.g. points with x = `a_class`, or a histogram). The graph’s expression list can reference the named list you set in CL.
4. **Optional:** Use a **Submit** button with **capture** on Slide 1 so you only aggregate after students submit (avoids graphing default/origin values from students who haven’t responded yet).
5. **Testing:** Aggregation often does not work correctly in **preview**. Test by creating a **class code**, then opening the activity in **two or more incognito windows** as different students.

**Screen 2 graph CL (minimal):**
```
number("a"): graph1.number("a")
numberList("a_{class}"): aggregate(graph1.number("a"))
```

### Tips

- **Color / opacity:** Use a lighter color or opacity (e.g. &lt; 1) for aggregated points so many overlapping points don’t overpower the screen. Overlap can highlight trends or common responses.
- **Animations:** A “Show class data” button can fade in aggregated points (one by one or all at once).
- **Hide incomplete responses:** If students haven’t responded yet, aggregated data can be misleading (e.g. default/origin values). Use a “Submit” (or similar) action so you only graph **submitted** responses.
- **Example activities:** [Graph Template with Aggregation](https://teacher.desmos.com/activitybuilder/custom/5aa722d66bfc434522b1f4f4), [Aggregate Question](https://teacher.desmos.com/activitybuilder/custom/61aec0908a458151e7a3c30d) (Desmos Classroom).

---

## Examples category (Forum)

Interesting, useful, or unique CL examples:
- [About the Examples category](https://cl.desmos.com/t/about-the-examples-category/123)
- [Show/Hide a Component](https://cl.desmos.com/t/show-hide-a-component/2028)
- [Play music in Desmos](https://cl.desmos.com/t/play-music-in-desmos/7612)
- [Match My Function (function notation)](https://cl.desmos.com/t/match-my-function-using-function-notation/1487)
- [Piecewise Expressions in Notes](https://cl.desmos.com/t/piecewise-expressions-in-notes-component-based-approach/4106)
- [Self-grading quiz / randomized test / class averages](https://cl.desmos.com/t/an-example-of-a-randomized-test-with-self-grading-locked-answers-and-class-averages/1613)
- [Content Sink / Guess My Number](https://cl.desmos.com/t/desmos-demo-content-sink-providing-feedback-guess-my-number-activity/669)
- [Linear Functions Infinite Practice with Streak Counter](https://cl.desmos.com/t/linear-functions-and-inequalities-infinite-practice-with-streak-counter/4246)
- More: [Full Examples list](https://cl.desmos.com/c/examples/8)

---

## Getting the full official documentation into this file

The official pages at **classroom.amplify.com** and **teacher.desmos.com** render content with JavaScript, so a simple HTTP fetch only sees “Loading…”. To pull that content into `cl-docs.md`:

1. **Run the scraper (requires Node and Puppeteer):**
   ```bash
   npm install
   node scrape-docs.js
   ```
   This opens the documentation in a headless browser, waits for content, and appends the extracted text to `cl-docs.md` (or see script output for the path it writes).

2. **Pull forum example code** into `cl-examples.md` for better code-generation context:
   ```bash
   node scrape-examples.js
   ```
   This scrapes CL code snippets from the [forum Examples category](https://cl.desmos.com/c/examples/8) and writes them to `cl-examples.md`. The server uses this file when generating code if it exists.

3. **Or:** Open the [Computation Layer Documentation](https://classroom.amplify.com/computation-layer/documentation) and [Components](https://classroom.amplify.com/computation-layer/documentation#components) in a browser, then manually copy the sections you need into this file.




---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation

Welcome
Welcome to Computation Layer!
Thousands of teachers use Computation Layer (CL) to add an extra layer of interactivity and feedback to their activities. We at Desmos use it in every one of our activities.
CL is the glue that holds activities together. It lets you connect representations, customize content, and provide dynamic, interpretive feedback.
These docs are filled with examples to help you get started. You can also click the script icon in the corner of any component to try it yourself.
If you have any questions, visit our discussion forum at cl.desmos.com, reach out on Twitter, or check out one of our Professional Learning events. Happy building!
Next Up: Getting Started

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#components

Components
Components are the heart of Computation Layer. Scripts are usually attached to a component through the script icon. Scripts can also be attached to an entire screen to control the behavior of the screen itself.
In order to access the sources of a component, you first need to name it:
To add a script to a component and make use of its sinks, click the script icon next to the component:
Next Up: Action Button

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#sinks-sources

Sinks and Sources
CL might look different from other programming languages you're used to. Instead of operating as a list of commands that run one after another, CL allows you to wire different pieces together to keep their values consistent. For example, a = b means that a is always the value of b. The value of a will change whenever the value of b does. This is similar to how spreadsheets work. It's also how the Desmos calculator works.
"Sinks" and "Sources" are the way to get values into and out of components. For example, the statement number("m"): exp1.numericValue means that the value of 
"m"
m inside of this Graph component equals the computed value of the Expression Input component named "exp1." As a student types into that Expression Input, the value of 
"m"
m in the graph will update immediately.
Sinks
Use sinks to inject values into components. Sinks are colored teal and are always followed by a colon. For example, you could make a graph that plots 
"y" equals "m" "x" plus "b"
y=mx+b and then use the graph's "number" sink to set values for the variables 
"m"
m and 
"b"
b.
# Set the values of m & b in the graph
number("m"): 1.5
number("b"): 2
Variables
You can define variables within a script. This makes your code more reusable and helps you avoid repeating the same code. Note that variables look very similar to sinks but behave very differently.
Suppose you wanted the submitLabel and initialText on an input to both say, "Hello world!"
#if you change this line, both submitLabel and initialText will change.
customString = "Hello world!"
​
submitLabel: customString
initialText: customString
Pro tip: You can reference variables defined in other components by using the "script" keyword. For example:
choiceContent(1): input1.script.customString
Sources
A source is a value that you can pull out of a component and is typically based on work a student has done. To use a component's source, name the component and the use that name in your script.
For example, let's say that you have a button that you've named btn1. You can use its sources in any script anywhere in the activity, like this:
#pressCount is a simple number
number("b"): btn1.pressCount
​
#the "timeSincePress" source asks for a duration.
#this will stop reporting after 10 seconds.
number("a"): btn1.timeSincePress(10)
Pro tip: If you want to access a source from a component you're in, you don't need to name the component. In a button Component's script, for example, just write label: this.pressCount.
Next Up: Dynamic Text

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#correctness

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Sinks and Sources
Dynamic Text
Conditionals
Correctness
Components
Advanced
Index
Correctness
Checking student responses for correctness is a great way to both provide students with feedback and help teachers quickly see correctness in the teacher dashboard.
In general, we recommend being very careful when adding correctness checks to an activity. Computers are pretty dumb and might mark work wrong when a human would mark it correct, which is a really demoralizing experience for students. Here are a few tips for writing correctness.
Compare Values
If you want to check that a student got a number right, you can compare its value. This is generally safe if the answer is an integer, but risky otherwise! Always test it out yourself with a few values you expect to work. Here's a very simple example of checking whether the value is greater than 7:
#define a variable to test correctness
#note: we can use this value elsewhere since it's a variable.
correct = this.numericValue > 7
​
#populate the "correct" SINK for this component.
#this will update what you see in the teacher dashboard
#note the use of sink (correct:) and variable (correct =)
correct: correct
We can reuse that computation to create a feedback string in a note:
#read off correctness from a different component
#save as a variable the note can use. 
feedback =
  when exp1.script.correct "That's correct!"
  otherwise "Not correct yet."
Use the Graphing Calculator
For more complicated examples of correctness, one nice technique is to use the graphing calculator. We like to use movable points with a step set on sliders (sliders are made with the graph component, not a separate component) to enable snapping.
In this example, we want a slope of 2. The graph computes the slope using a variable called 
"m"
m, and then uses snapping. The Computation Layer is just this line:
#define a local correctness variable:
isCorrect = this.number("m") = 2
​
#populate the correct sink, for the dashboard
correct: isCorrect
Use Conditionals
For more advanced correctness in the calculator, you can use conditionals. Build in a little tolerance for extra safety (e.g.,C={|a-7.4| ≤ 0.1: 1, 0}).
Most importantly, always try your correctness checks yourself with a range of inputs before giving them to students!
Next Up: Components

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:action-button

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Action Button
8 sinks4 sources
capturekey: string
Sets a variable you want to capture every time the action button is pressed. (Retrieve the history of that variable later using the history source.)
# We're telling the action button to capture the variables "a" and "b"
# from a graph component named "historyGraph". "xCoord" and "yCoord"
# are names that capture, lastValue, and history all share.
​
capture("xCoord"): historyGraph.number("a")
capture("yCoord"): historyGraph.number("b")
label
Sets the text to show on the button. Keep it short.
# This "label" sink has a conditional statement attached that will change the label
# from "Press Me!" to "Too Many!" after the button has been pressed 10 times.
​
label:
    when myButton.pressCount < 10 "Press Me!"
    otherwise "Too Many!"
​
resetLabel
Sets the link text we'll show that lets the student reset the action button.
# When the action button is pressed the label displayed will be
# "Make a Bad Time Again". When pressed, the button will reset to its
# unpressed label and state.
​
resetLabel: "Make a Bad Time Again"
​
disabled
Sets a Boolean that determines when the action button is disabled or enabled. (When it's disabled, we gray out the button and make it unpressable.)
# When the button named "beCarefulButton" is pressed for the fifth time
# this button will become disabled.
​
disabled: beCarefulButton.pressCount = 5
style
Sets the button style. Use "default" for our standard blue style. Other options are "red" for a warning or for a confirmatory second click, "white" for a secondary click on a dark background, and "link" for our standard link.
# Before the button is pressed this button will have the default style.
# After pressing the button once the button will turn red.
# After the button has been pressed for a second time it will turn and stay as a link.
​
​
style:
  when this.pressCount = 0 buttonStyles.default
  when this.pressCount = 1 buttonStyles.red
  otherwise buttonStyles.link
resetStyle
Sets the button style when in "reset" state. Use "link" for our standard link or "white" for button styling on a dark background.
# This controls the reset style of the button label.
​
resetStyle: buttonStyles.red
​
​
# Sets the text of the reset label so it will appear.
​
resetLabel: "Reset"
​
hidden
When true, this component will not be shown to students.
# When the button named "beCarefulButton" is pressed for the fifth time
# this button will be hidden.
​
hidden: beCarefulButton.pressCount = 5
resetOnChange
Specify a string value. If that value changes, the component resets.
# resetOnChange looks for any change in a string.
# Here, it resets the button time to 0 when the point is moved.
​
resetOnChange: "${graph.number("v")}${graph.number("h")}"
​
timeSincePressmaxTime: number
Gets the seconds (plus milliseconds) since the "Submit" button was pressed. It resets to zero if the "reset" link is pressed, or if a component on the same page is focused or edited. By default, it runs to 10 seconds and then stops. Increase that time by passing a parameter, as in timeSincePress(20).
# This code imports the time since a student pressed an
# action button called "submitMe" and assigns it to a variable
# called "myTime".
​
myTime = submitMe.timeSincePress
​
# This code injects that time into a sentence in the note.
​
content:
​
"It has been ${myTime} seconds since you pressed \"Submit\"."
historykey: string
Gets the history of a variable that was defined using the "capture" sink.
# The action button named "captureButton" knows that the "history" of "xCoord"
# refers to the number "a" in a graph component that was defined there.
# So now we take the history of all those "a" values and sink them into a
# numberList called a_list, which we'll use in ways that are defined in this graph
# component. (Same for "yCoord".)
​
numberList("a_{list}"): captureButton.history("xCoord")
numberList("b_{list}"): captureButton.history("yCoord")
​
lastValuekey: string
Gets the last value captured for a variable that was defined using the "capture" sink.
# The action button named "captureButton" knows that the "history" of "xCoord"
# refers to the number "a" in a graph component that was defined there.
# "lastValue" is used similarly to "history", but it sources a single number,
# not a list – the last number captured.
​
number("a_{recent}"): captureButton.lastValue("xCoord")
number("b_{recent}"): captureButton.lastValue("yCoord")
pressCount
Gets the number of times the action button has been pressed.
# This number sink looks for an action button named "liftoff"
# and then sources the number of times it was pressed and
# then assigns it to "a" in the graph component.
​
number("a"): liftoff.pressCount
​
# Open the graph component to see how we used "a" to
# make a pyramid.
Next Up: Card Sort

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:challenge

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Challenge Creator
8 sinksno sources
preventSubmissionReason
Can the student submit this challenge? Provide an error message if not, empty string if so.
# Enable students to submit their response if a multiple choice option has been selected. 
# Otherwise disable the “Submit Response” button and display the message “Make a selection.”
preventSubmissionReason: 
  when mcCC2.isSelected(1) or mcCC2.isSelected(2) or mcCC2.isSelected(3) ""
  otherwise "Make a selection."
preventChallengeCreationReason
Has the challenge creator correctly set up their challenge? Warning if not, empty string if so.
# Enable students to submit their challenge if the input contains a numeric value.
# Otherwise disable the “Submit Challenge” button and 
#display the message “Enter a numeric value.”
preventChallengeCreationReason: 
  when isDefined(inputCC1.numericValue) ""
  otherwise "Enter a numeric value."
challengeText
Specify text to display on the thumbnail of the challenge or the response.
# Set the text that appears on the challenge thumbnail to the
# expression that the challenge creator enters on the first screen.
challengeText: inputCC1.latex
challengeBackground
Specify a thumbnail image for the challenge.
# Set the background of the challenge thumbnail to show the sketch 
# and graph layers of the sketch component on the first screen.
challengeBackground: layerStack(graphLayer(sketch1.calculatorState),sketchLayer(sketch1.sketch))
​
# Set the window of the challenge thumbnail to be bound in both the 
# x and y directions between -10 and 10.
challengeBounds: makeBounds(-10,10,-10,10)
​
challengeBounds
Set the bounds of the challengeBackground.
# Set the background of the challenge thumbnail to show the sketch 
# and graph layers of the sketch component on the first screen.
challengeBackground: layerStack(graphLayer(sketch1.calculatorState),sketchLayer(sketch1.sketch))
​
# Set the window of the challenge thumbnail to be bound in both the 
# x and y directions between -10 and 10.
challengeBounds: makeBounds(-10,10,-10,10)
​
responseText
Specify text to display on the thumbnail of the challenge or the response.
# Set the text that appears on the response thumbnail to the
# explanation that the responder enters on the second screen.
responseText: mcCC2.explainContent
responseBackground
Specify a thumbnail image for the response.
# Set the background of the response thumbnail to show
# what the student sketched on the second screen.
responseBackground: layerStack(graphLayer(sketch2.calculatorState),sketchLayer(sketch1.sketch),sketchLayer(sketch2.sketch))
​
# Set the window bounds of the the response thumbnail 
# to match the second screen.
responseBounds: makeBounds(-10,10,sketch2.script.y,sketch2.script.z)
responseBounds
Set the bounds of the responseBackground.
# Set the background of the response thumbnail to show
# what the student sketched on the second screen.
responseBackground: layerStack(graphLayer(sketch2.calculatorState),sketchLayer(sketch1.sketch),sketchLayer(sketch2.sketch))
​
# Set the window bounds of the the response thumbnail 
# to match the second screen.
responseBounds: makeBounds(-10,10,sketch2.script.y,sketch2.script.z)
Next Up: Free Response

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:input/text

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Free Response
7 sinks3 sources
initialText
Sets the initial value of the text input.
# This sets the text all students will begin with
# in the text box. To include any math formatted
# text, remember to use backticks ``.
​
​
initialText: 
"I notice . . .
​
I wonder . . ."
placeholderText
Sets the placeholder text of the input.
# This sets placeholder text that will disappear
# once students have clicked into the free
# response box or typed a response.
​
placeholderText: "Type your answer here."
showSubmitButton
When true, force show submit button. When false, force hide submit button, unless a source relies on it.
# when set to 'false' this input will not have a submit
# button. Try toggling 'true' and 'false' below to see.
showSubmitButton: false
submitDisabled
Disable the submit button. Note: Even if set to false, the input button will be disabled if the input is empty.
# Disable submitting of the text response until the graph has 
# been interacted with.
submitDisabled: graph.number(`m_{ove}`) = 0
submitLabel
Specify a label for the submit button.
# Changes the text on the "submit" button.
# Here, double quotation marks are used to indicate
# that 'Submit Name' is a string.
submitLabel: "Submit Name"
hidden
When true, this component will not be shown to students.
# Hides the component after it has been submitted
hidden: this.timeSinceSubmit() > 0
resetOnChange
Specify a string value. If that value changes, the component resets.
No code sample available
content
Gets the student input value as a string.
# This code imports the value a student typed into
# an input called “nameInput” and assigns it to a
# variable called “myName”.
​
myName = nameInput.content
​
# This code injects that name variable into the
# content of a note
​
content: "Welcome to the activity, ${myName}!"
timeSinceSubmitmaxTime: number
Gets the seconds (plus milliseconds) since the submit button was pressed.
# This code imports the time since a student pressed submit
# on an input called “nameInput2” and assigns it to a variable
# called "myTime". It will be used to define the y-coordinate
# of the point on the graph.
​
myTime = nameInput2.timeSinceSubmit
​
# This code injects that time variable into a number in a
# graph component. The point (0,y_val) will then rise
# vertically as more time passes since the button was pressed.
​
number("y_{val}"): myTime
​
# Change the point label to match the student's name.
​
pointLabel("P"):
​
    when myTime < 2 and nameInput2.submitted "Hi, ${nameInput2.content}."
    when nameInput2.submitted "Okay, bye, ${nameInput2.content}."
    otherwise ""
submitted
Gets a Boolean value indicating whether or not the input has been submitted.
# This code imports the value a student typed into
# an input called “nameInput3” and assigns it to a
# variable called “name”.
​
name = nameInput3.content
​
# This code displays content in a note. If the input has been
# submitted, we display a greeting. If it hasn’t been
# submitted, we display a request.
​
content:
​
     when nameInput3.submitted "Good to meet you, ${name}."
     otherwise "Please type your name below."
Next Up: Graph and Graphing Calc

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:input/graph

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Graph and Graphing Calc
21 sinks11 sources
animationDuration
Adds an animation playhead on top of the graph as if it were a video. This sets the duration for the animation. A non-positive value hides the playhead. Note: Only works with graph exhibits.
# Sets the length of time the animation playhead runs for.
​
animationDuration: when animationInput.submitted animationInput.numericValue otherwise 0
​
# Sets a value in the graph to be defined by the time of the 
# animation playhead.
​
number("t_0"): this.animationTime
animationKeyboardStepValue
Sets the amount of time (in seconds) that an animation moves when its scrubber is adjusted with the arrow keys. If not specified, the scrubber moves in increments of 1 second. Note: Only works with graph exhibits.
# Sets the length of time the animation playhead runs for.
​
animationDuration: numericValue("2*\\pi")
​
# Sets the step value for the scrubber when using tab and
# the arrow keys to navigate around the screen. 
animationKeyboardStepValue: 
# In this example, entering a number into the math input
# and submitting allows you to customize the step size
when animationInput.submitted animationInput.numericValue 
# Otherwise the step size defaults to pi/8
otherwise numericValue("\\pi/8")
​
# Sets a value in the table to be defined by the time of the 
# animation playhead.
​
number("t_0"): this.animationTime
saveOnChange
Specify a string value. If that value changes, the component saves its state.
# Saves the graph state whenever the number "a"
# is updated in the graph.
saveOnChange: "${this.number(`a`)}"
resetAnimationOnChange
Specify a string value. If that value changes, the animation timer resets.
# Create the animation cover.
# In this example, set the total length to 60 sec.
animationDuration: 60
number(`t_0`): this.animationTime
​
# Reset the animation every time "btn" is pressed.
resetAnimationOnChange: "${btn.pressCount}"
numberidentifier: latex
Sets the value of a variable in the calculator. This will override any existing definitions of that variable.
# Sets the value of "a" in the graphing calculator to be
# the numeric value of "xValue" provided that it has been
# submitted. Otherwise we choose an x value that is far outside
# of the graph bounds.
​
number("a"):
  when xValue.submitted xValue.numericValue
  otherwise 10000
numberListidentifier: latex
Sets a variable in the calculator to the contents of a list. This will override any existing definitions of that variable.
# Sets a list in the calculator to the first column
# of a table named "guessTable".
​
numberList("G_{uessX}"): guessTable.columnNumericValues(1)
expressionidentifier: latex, ...allowedSymbols: latex
Sets a variable in the calculator to an expression with the provided latex. This will override any existing definitions of that variable. The first parameter is the name of the variable or function to be defined. The optional additional parameters specify the symbols that the latex expression is allowed to reference. (By default, it will not be allowed to reference any existing variables or functions in the calculator.)
No code sample available
pointLabelidentifier: string
Sets a label for a point. This only works for points defined like A=(1,2), and the identifier needs to match the name given to the point (A in this case). Takes a string. The label next to the point exactly matches the provided string, so the label is turned off if the empty string is provided.
# For any named point in the graph, we can define the label using a string of text.
# For LaTex, ensure that the text is surrounded by backticks ``. Labels can only be
# one type of font. Either all LaTex or all regular font. Size and orientation of
# the point label can be set in the graph.
​
pointLabel("a"): 
  when pointLabelInput.submitted "`${pointLabelInput.latex}`"
  when this.number("s_{uccess}") > 0.95 "🔥"
  when this.number("s_{uccess}") > 0.75 "🥵"
  when this.number("s_{uccess}") > 0.50 "😎"
  when this.number("s_{uccess}") > 0    "🥶"
  otherwise ""
  
  
xAxisLabel
Sets the string we display along the x-axis. This overrides any user interaction, so we caution against using it with fullscreen graphs.
# This will look at certain cells in a table
# and use the contents there to set the x-axis
# label.
​
xAxisLabel: "Time (${xAxisLabelTable.cellContent(1,1)})"
yAxisLabel
Sets the string we display along the y-axis. This overrides any user interaction, so we caution against using it with fullscreen graphs.
# This will look at certain cells in a table
# and use the contents there to set the y-axis
# label.
​
yAxisLabel: "Remaining Ice Cream (${yAxisLabelTable.cellContent(1,1)})"
audioTraceReverseExpressions
Specifies whether expressions are traversed in reverse order when audio trace is active. This behavior may be desired in situations where the curves you wish a student to examine are declared at the end of the calculator's expression list so that they appear in the foreground.
# In audio trace mode, navigates the 
# expressions in reverse order when 
# set to true.
audioTraceReverseExpressions: true
​
trace
Allows tracing curves to inspect coordinates and shows point coordinates when clicked.
# Trace allows students to click on points and lines
# to show the coordinates of the point on the graph
# they clicked on. Here, we have set "trace: true"
# and "trace: false" only as an example. Simply type
# "trace: false" if you want to prevent students from
# clicking on the graph to show more information. By
# default, it is set to true.
​
trace: traceChoice.isSelected(1)
narrationnarrationIndex: number
Text that screen readers will read aloud. Similar to image alt text, narration can be used to describe a graph or sketch. Example: narration: "The graph shows a plot of time studied (in hours) on the x-axis and test scores on the y-axis." You can include multiple narrations for a graph to separate pieces of information from one another. Example: narration(1): "A description of the graph's main characteristics would go here." narration(2): "The line does not pass through all of the points." In the above example, narration(2) could change as the student interacts with the activity without needing to modify the graph description in narration(1). Separating narrations also minimizes the amount of text a screen reader needs to speak.
# This sink defines what students with vision-impairment will
# hear when they use screen readers. Use multiple narration sinks
# to separate static and dynamic narrations.
​
narration(1): "A very badly drawn bird flies beneath a glowing sun."
​
narration(2):
    when narrationGraph.number("t") > 7 "The bird is under the sun now."
    otherwise ""
bounds
Sets the bounds of the graph. Commonly used in combination with the "background" sink. This overrides user interaction, so we caution against using it with fullscreen graphs.
# Get variables from the graph that tell us
# the desired boundaries of the graph. Store
# those in Computation Layer variables.
​
xSmall = zoomGraph.number("x_{small}")
xBig = zoomGraph.number("x_{big}")
​
ySmall = zoomGraph.number("y_{small}")
yBig = zoomGraph.number("y_{big}")
​
# If "zoomButton" has been pressed, set the bounds of the
# graph to be variables we have declared in the script.
# Otherwise set the bounds to be a standard view.
​
bounds:
  when zoomButton.timeSincePress > 0 makeBounds(xSmall, xBig, ySmall, yBig)
  otherwise makeBounds(-10,10,-10,10)
background
Sets the background layer of the graph.
# These are functions that transform the sketch. We then use
# layerStack to combine them into one layer.
​
sketch1 = sketchLayer(sketchA.sketch.transform(
    simpleFunction("2x","x","y"),simpleFunction("2y","x","y")))
sketch2 = sketchLayer(sketchA.sketch.transform(
    simpleFunction("4x","x","y"),simpleFunction("4y","x","y")))
sketch3 = sketchLayer(sketchA.sketch.transform(
    simpleFunction("6x","x","y"),simpleFunction("6y","x","y")))
sketch4 = sketchLayer(sketchA.sketch.transform(
    simpleFunction("7x","x","y"),simpleFunction("8y","x","y")))
sketch5 = sketchLayer(sketchA.sketch.transform(
    simpleFunction("10x","x","y"),simpleFunction("10y","x","y")))
​
# The background sink is used to set the background of the graph.
​
background: layerStack(sketch1,sketch2,sketch3,sketch4,sketch5)
showResetButton
If this is a geometry component, controls the presence of the reset button.
No code sample available
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# Sets the screen's "correct" sink to "true"
# if the student has created a square with the
# side length of 2 units.
​
correct: this.number("a") = 2
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# This will set a warning on the Teacher Dashboard. When
# the message is set to blank ("") it will hide the warning.
​
warning:
  when this.number("b") = 0 "Student has set the circumference to zero."
  otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# Read Only determines whether the dashboard should be
# showing any form of correctness. Here, we have set
# and "readOnly" only as an example. Simply type
# "readOnly: true" if you do not want any information
# to be shown in the dashboard from the component.
​
readOnly: readOnlyChoice.isSelected(2)
hidden
When true, this component will not be shown to students.
# Use hidden to set the condition under which
# you want a component to be hidden. It will 
# still run in the background but it will be
# hidden from the student's screen.
​
hidden: hiddenChoice.isSelected(2)
functionidentifier: latex
Sets the output of simpleFunction() to a variable defined in the graph.
# Get the latex string from "equationInput" and assign
# it to f in the calculator.
​
function("f"): simpleFunction(equationInput.latex, "x")
numberlatex: latex
Gets the numerical value of a variable in the graph.
# Sets the correct sink as true when the "c_orrect" variable
# in the tangentGraph calculator component is equal to 1.
correct: tangentGraph.number("c_{orrect}") = 1
​
numberListlatex: latex
Gets the list of numbers that was assigned to the variable in the graph.
# This code uses the numberList source from graph1
# to create a matching list in this sketch component.
# The list is used to control the spacing between gridlines.
numberList("L"): graphLeft.numberList("L")
​
​
# Set the bounds of this sketch component using the variables
# x_m, x_M, y_m, y_M in graph1.
bounds: makeBounds(graphLeft.number("x_m"), graphLeft.number("x_M"), graphLeft.number("y_m"), graphLeft.number("y_M"))
​
calculatorState
Gets the full state of a graph. Pass this, for example, into the graphLayer method.
# This creates a background graph layer by pulling the state of
# the graph from tangentGraph1 (found on screen 1) into this component.
​
background: graphLayer(tangentGraph1.calculatorState)
bounds
Gets the bounds of a graph component.
# This will set the bounds of the sketch to match the bounds
# of the graph component.
​
bounds: graph1.bounds
labelTextidentifier: string
Gets the content from a point label based on the name of the point.
# This sets the variable to be equal to the text of 
# the label if the student drags the graph slider (movable point) above zero.
# If students have it less than or equal to zero, it will
# be blank and not display any text.
​
topic1 = when ratingGraph.number("x_1") <= 0 "" otherwise "• ${ratingGraph.labelText("l_1")}\n"
topic2 = when ratingGraph.number("x_2") <= 0 "" otherwise "• ${ratingGraph.labelText("l_2")}\n"
topic3 = when ratingGraph.number("x_3") <= 0 "" otherwise "• ${ratingGraph.labelText("l_3")}\n"
topic4 = when ratingGraph.number("x_4") <= 0 "" otherwise "• ${ratingGraph.labelText("l_4")}\n"
topic5 = when ratingGraph.number("x_5")  = 0 "" otherwise "• ${ratingGraph.labelText("l_5")}!"
​
content: 
  "Drag the movable points to show how you feel about each topic.\n\nThe things you like are:\n${topic1}${topic2}${topic3}${topic4}${topic5}"
  
​
labelLatexidentifier: string
Gets the inner latex content from a point label based on the name of the point.
# This content sink will display the label that
# corresponds with the equation type that is 
# selected. labelLatex brings in the point label
# defined in graph1 for the points P_1, P_2 and P_3.
# Note: ${ } are used to interpolate the latex into the 
# content string and backticks are used to format as math.
​
content: 
  when choice.isSelected(1) "Linear Equation: `${graph1.labelLatex("P_1")}`"
  when choice.isSelected(2) "Quadratic Equation: `${graph1.labelLatex("P_2")}`"
  when choice.isSelected(3) "Exponential Equation: `${graph1.labelLatex("P_3")}`"
  otherwise "Select a type of equation."
labelNumericValueidentifier: string
Evaluates to content of a point label based on the name of the point.
# This takes finds the difference between the x-value of the point 
# and the numeric value of the point's label. The tolerance set for 
# each point is 0.2 units
difference = simpleFunction("\\left|x-y\\right|","x","y")
​
# c1-4 evaluates the "difference" function from above at the location of
# the movable point and the numeric value of its label.
c1 = difference.evaluateAt(this.number("x_1"),this.labelNumericValue("a_1")) < 0.2
c2 = difference.evaluateAt(this.number("x_2"),this.labelNumericValue("a_2")) < 0.2
c3 = difference.evaluateAt(this.number("x_3"),this.labelNumericValue("a_3")) < 0.2
c4 = difference.evaluateAt(this.number("x_4"),this.labelNumericValue("a_4")) < 0.2
​
# Adds a check mark to the summary screen of the dashboard if
# c1, c2, c3, and c4 are all true
correct: c1 and c2 and c3 and c4
animationTime
Gets the position of the animation playhead. Use in conjunction with animationDuration.
# Sets a value in this sketch to be defined by the time of the 
# graph's animation playhead.
​
number("t_0"): animationGraph.animationTime
isAnimating
Tells whether the animation is running. Use in conjunction with animationDuration.
# Sets the duration of this animation
animationDuration: 5
​
# Creates a variable in the calculator that is 1 when the 
# animation is playing and 0 when it is not.
number(`i_{sAnim}`): when this.isAnimating 1 otherwise 0 
currentX
Gets the current x-coordinate of the mouse. Works on hover with a mouse and while depressed for touch.
# Create variable x_1 in the graph using the x-location of the cursor
number(`x_1`): this.currentX
​
# Create variable y_1 in the graph using the y-location of the cursor
number(`y_1`): this.currentY 
currentY
Gets the current y-coordinate of the mouse. Works on hover with a mouse and while depressed for touch.
# Create variable x_1 in the graph using the x-location of the cursor
number(`x_1`): this.currentX
​
# Create variable y_1 in the graph using the y-location of the cursor
number(`y_1`): this.currentY 
Next Up: Image

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:input/expression

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Math Response
21 sinks8 sources
initialLatex
Sets the initial value of the expression input. Should be a valid LaTeX string.
# This sink uses the LaTeX representation for "f(x)="
# which will display in the expression input.
# Note that we have enclosed the LaTeX in quotes so that it's a string.
​
initialLatex: "f\left(x\right)="
placeholderLatex
Sets the placeholder of the input. Should be a valid LaTeX string.
# This sets placeholder latex that will disappear
# once students have clicked into the math input
# box or typed a response.
​
placeholderLatex: `(x,y)`
disableEvaluation
Never show evaluated user input on student side.
# When set to true, this sink won't display the value of an
# expression, which is especially useful when finding the value
# of an expression is the point of the question.
​
disableEvaluation: true
​
errorMessage
An error to show to the student. Note: This will not show up in the teacher dashboard. (Use the "warning" sink to show warnings to the teacher.)
# Displays an error message to the student if they type
# an answer that isn't a defined value.
​
errorMessage:
    when isUndefined(this.numericValue) "You have to type a valid number."
    otherwise ""
suffix
Adds a suffix to everything entered by the student. Recommended for inputs that expect a certain unit (e.g., ft. or %).
# This code displays a suffix in the input field
# when the input field is focused on or not blank.
# A numeric value of 1 or -1 will display the singular 
# "person" and any other value will display the plural "people"
​
​
suffix: when this.numericValue = 1 or this.numericValue = -1 "person" otherwise "people"
capturekey: string
Sets a variable you want to capture every time the expression input is submitted. (Often times this is the numeric value of the expression input.) Retrieve the history of that variable later using the history source.
# We're telling the action button to capture the numericValue of this input
# "xval" is a name that capture, lastValue, and history will all share.
capture("xval"): this.numericValue
submitLabel
Specify a label for the submit button.
# This code changes the text on the submit button
# to "Guess". Note how we've enclosed the label in
# double quotation marks to create a string.
​
submitLabel: "Guess"
showSubmitButton
When true, force show submit button. When false, force hide submit button, unless a source relies on it.
# when set to 'false' this input will not have a submit
# button. Try toggling 'true' and 'false' below to see.
showSubmitButton: false
resetLabel
Specify a label for the reset link.
# This changes the text on the reset button to
# "Guess again". Note how we've enclosed the label
# in double quotation marks to create a string.
​
resetLabel: "Guess again"
clearOnReset
If true, when the user goes to edit their expression, we'll clear the prior one.
# This code clears the input each time it is reset.
# If no clearOnReset sink is used, it will default
# to "false".
​
clearOnReset: true
submitDisabled
Disable the submit button. Note: Even if set to false, the input button will be disabled if the input is empty.
# This code disables the submit button when
# the number of guesses reaches 3.
​
submitDisabled: this.submitCount >= 3
initialText
Sets the initial value of the text input when students are asked to explain their thinking.
# Here we created a sentence frame for the student using initialText.
# As we did for the explain prompt, we have enclosed 
# the LaTeX in quotes so that it's a string.
​
initialText: "My strategy was . . ."
explainPrompt
Sets a string that replaces the generic "Explain your thinking" prompt in the text input when students are asked to explain their answer.
# Here we set the prompt for the explain field to 
# "What strategy did you use to make your estimate?"
# Note that we have enclosed the LaTeX in quotes so that it's a string.
# If not set manually, the prompt defaults to "Explain your thinking."
​
explainPrompt: "What strategy did you use to make your estimate?"
showPeerResponses
Overrides the "show classmates' responses" checkbox, and lets you use that feature even when it's not at the end of a column.
# This code will make the peer responses show
# even though this component is not at the bottom
# of the column.
​
showPeerResponses: true
showExplain
Should we ask students to explain their answer?
# This code is used to only show the explain
# prompt after the correct answer is entered
# (in this case the correct answer is 86)
# and the answer has finished revealing
# (8.6 seconds)
​
showExplain: this.numericValue = 86 and this.timeSinceSubmit() > 8.6
disableEdit
Disables editing the expression.
No code sample available
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# Marks the screen correct if the student types an answer
# equivalent to 1/20.
​
correct: fractionChecker.numericValue = 0.05
​
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# Here we set the text we want the warning to display.
# When the text is set to blank (a set of double
# quotation marks with nothing in between them - ""), it
# will not display any warning message. The warning
# message displays only on the Teacher Dashboard.
​
warning: when this.numericValue <= 0 "Enter a positive number." otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# When the readOnly flag is set to "true" we will
# display a dash in the teacher dashboard, indicating
# that there isn't work here that is worth the teacher's
# time to check.
​
readOnly: true
hidden
When true, this component will not be shown to students.
# Hides the component after it has been submitted.
hidden: this.timeSinceSubmit() > 0
resetOnChange
Specify a string value. If that value changes, the component resets.
# resetOnChange looks for any change in a string
# Here, it resets the button time to 0 when the point is moved.
​
resetOnChange: "${graph.number("v")}${graph.number("h")}"
​
latex
Gets the LaTeX string of the input, which is useful for importing into the graphing calculator, the note, and other components.
# This extracts the latex-formatted math the student has entered, and inserts
# it into the note's text, wrapping it in ` characters so that it will print as math.
​
​
content: "Trying to graph `${expressionInput.latex}` as a function of `x`."
numericValue
Gets the evaluated value of an expression input. For example, "2+2" will return the number 4.
# This imports the numeric value of the "inspectInput" expression input and
# assigns it to the variable "a" in the graph component.
​
number("a"): inspectInput.numericValue
timeSinceSubmitmaxTime: number
Gets the seconds (plus milliseconds) since the the expression input was submitted. It resets to zero if the student focuses into the input again. Increase that time by passing a parameter, as in timeSincePress(20).
# This imports the time since the expression input
# was submitted.
​
number("t_0"): raceButton.timeSinceSubmit
​
# This imports the speed the student submitted
# in the expression input. If the speed isn't defined
# yet (if the input is blank for instance) we default
# to "1".
​
number("s_{peed}"): firstDefinedValue(raceButton.numericValue,1)
submitted
Gets a Boolean value that indicates whether or not the expression input has been submitted.
# This imports the numeric value of the "inspectInput" expression input and
# assigns it to the variable "a" in the graph component ONLY IF the student
# has pressed the "Submit" button. Otherwise, we assign "a" the value of 10000
# to push it off the exhibit.
​
number("a"): 
​
    when newInspectInput.submitted newInspectInput.numericValue
    otherwise 10000
explainContent
Content of the "explain" text box.
# This extracts the response to the explain prompt that the student has entered,
# and inserts it into the note's text.
# This also hides all of the content in the note while the explain content is blank.
content: 
when isBlank(input.explainContent) "" 
otherwise "Here's the strategy you used to make your estimation:
​
${input.explainContent}"
historykey: string
Gets the history of a variable that was defined using the "capture" sink.
# This sink will take all the values captured by the
# history sink we set up in the expression input and store
# them in a number list called "x_history". We use that in the
# calculator to display values along the function.
​
numberList("x_{history}"): newInspectInputFinal.history("xval")
lastValuekey: string
Gets the last value captured for a variable that was defined using the "capture" sink.
# This sink will take all the values captured by the
# history sink we set up in the expression input and store
# them in a number list called "x_history". We use that in the
# calculator to display values along the function.
​
number("x_{last}"): newInspectInputFinal.lastValue("xval")
submitCount
Gets the number of times the input has been submitted.
# "submitCount" on this screen will display the number of times
# the expression input "guess" has been submitted.
​
content:
​
"Guess the secret number and we'll tell if you if it's to the left or right of your guess.
​
You've guessed ${guess.submitCount} times."
Next Up: Media

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:multiple-choice

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Multiple Choice and Checkboxes
15 sinks8 sources
choiceContentchoiceIndex: number
Sets the content for a given multiple choice option, indexed starting with 1. (This only works if the multiple choice option at this index includes some content already.)
# Display a dash on the dashboard no matter what option students select.
readOnly: true
​
# Sets the multiple choice option text.
choiceContent(1): "Apples"
choiceContent(2): "Bananas"
choiceContent(3): "Strawberries"
initialText
Sets the initial value of the text input for explain type multiple choice.
initialText:
​
    when this.isSelected(1) "I think linear is best because ..."
    when this.isSelected(2) "I think quadratic is best because ..."
    when this.isSelected(3) "I think exponential is best because ..."
    otherwise ""
prompt
Sets the small italicized prompt above the choices. If blank, no prompt will show up. If this sink is unused and the choice type is multi-select, we will use the default text: "(Select all that apply.)"
# Change the italicized text above the
# checkboxes from "(Select all that apply.)" 
# to "(Select at most 2 out of 3)".
​
prompt: "(Select at most 2 out of 3)"
showExplain
Should we ask students to explain their answer?
# This sink instructs CL to only show the "Explain your thinking" 
# input when the second choice is selected.
​
showExplain: this.isSelected(2)
maxSelectedChoices
Sets how many choices a student is allowed to select. Only applies to Checkbox components.
# Sets the maximum number of choices a student
# can select. The remaining choices gray out
# once the student has reached the maximum
# number of choices they can select.
​
maxSelectedChoices: 2
explainPrompt
Sets a string that replaces the generic "Explain your thinking" prompt on "explain" multiple choice components.
# Uses explainPrompt sink to dynamically change the request
# for more explanation on an explain multiple choice component.
​
explainPrompt:
​
    when this.isSelected(1) "Why is linear the best model?"
    when this.isSelected(2) "Why is quadratic the best model?"
    when this.isSelected(3) "Why is exponential the best model?"
    otherwise ""
​
maxButtonsPerRow
Takes a number from 1 to 10, and updates the layout to not allow more than that many buttons in a row. Note that built-in wrapping behavior could result in fewer buttons in a row. Only works with the "Button" layout of multiple choice or checkboxes, and only allows integer values between 1 and 10. Values less than 1 are ignored, and values greater than 10 are clamped to 10. Non-integers are first rounded.
# Set the maximum number of buttons in each row using the value or
# "n_1" (controlled by a movable point) in the graph.
​
maxButtonsPerRow: graphLeft.number(`n_1`)
submitLabel
Specify a label for the submit button.
# Changes the label on the button from 
# "Submit" to "Check My Work"
​
submitLabel: "Check My Work"
showSubmitButton
When true, force show submit button. When false, force hide submit button, unless a source relies on it.
# Instructs Desmos to show a submit button
# for this multiple choice component.
​
showSubmitButton: true
disableChange
When true, disable selecting a choice or changing an existing selection.
No code sample available
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# Marks the screen correct if the student chose either the first and
# fourth options or the second, third, and ffifth options
# in the checkbox component.
​
correct: 
  (this.isSelected(1) and this.isSelected(4) and not(this.isSelected(2) or this.isSelected(3) or this.isSelected(5))) or
  (this.isSelected(2) and this.isSelected(3) and this.isSelected(5) and not(this.isSelected(1) or this.isSelected(4)))
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# Marks the screen with a warning and a tooltip if the student
# didn't choose any of the three multiple choice options.
​
warning:
​
    when not(this.isSelected(1) or this.isSelected(2) or this.isSelected(3)) "No option selected!"
    otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# Display a dash on the dashboard no matter what option students select.
readOnly: true
​
hidden
When true, this component will not be shown to students.
# Hides this component once a choice has been made.
hidden: 
  this.isSelected(1) or 
  this.isSelected(2) or 
  this.isSelected(3)
resetOnChange
Specify a string value. If that value changes, the component resets.
# Resets the selected choice each time the button is pressed.
resetOnChange: "${btn.pressCount}"
​
​
matchesKey
Returns whether response matches the answer key. If no answer key is provided, returns false.
# Answers the question "Matches Key?" in the note with a "✅"
# when the seleected options match the answer key. 
match = 
  when choice.matchesKey "✅"
  otherwise ""
isSelectedchoiceIndex: number
Gets a Boolean that describes whether or not a particular multiple choice option has been selected, given the index of that option, starting with 1. This works for explain, simple, or multi-select multiple choice components.
# We use isSelected here to tell us which model has been selected.
# 1: linear. 2: quadratic. 3: exponential.
​
number("M"):
  when choice.isSelected(1) 1
  when choice.isSelected(2) 2
  when choice.isSelected(3) 3
  otherwise 0
​
timeSinceSubmitmaxTime: number
Gets the seconds (plus milliseconds) since the "Submit" button was pressed.
# This number sink uses timeSincePress to 
# create a timer that starts when the submit button
# is pressed and increases.
​
number("t_0"): choice.timeSinceSubmit()
submitted
Gets a Boolean value that indicates whether or not the multiple choice component has been submitted.
# This adds a "thank you" message to the end of the note after
# the "submit" button has been pressed.
# Note: the \n\n creates a double carriage return and we surround
# our message with double quotation marks to indicate a string.
​
thankYou = when choice.submitted "\n\nThank you for your response" otherwise ""
​
content: "How many pets do you have? ${thankYou}"
​
explainContent
Content of the "explain" text box.
# This note will display the question "Do you like chocolate?"
# until something is entered into the explanation field.
# Once the explainContent is not blank it will switch to 
# "You like/dislike chocolate because..." followed by
# The reason entered in the explanation field
​
preference = when choice.isSelected(1) "like" otherwise "dislike"
​
content: 
  when isBlank(choice.explainContent) "Do you like chocolate?"
  otherwise "You ${preference} chocolate because ... \n\n${choice.explainContent}"
​
# note: All of the text is surrounded by double quotations to 
# indicate a string and the choice and explain content are 
# inserted into the string using ${ }.
submitCount
Gets the number of times the multiple choice component has been submitted.
# Get the number of times the "mc4" multiple choice component
# has been submitted.
​
numSubmits = mc4.submitCount
​
# Add the plural "s" to a string when the number
# is greater than 1.
​
pluralizer =
​
    when not(numSubmits = 1) "s"
    otherwise ""
​
# Feedback string to student.
​
feedback =
​
    when mc4.submitted "
​
That's incorrect.
​
You have tried ${numSubmits} time${pluralizer} so far."
    otherwise ""
​
content:
​
"Which of these is best?${feedback}"
isSelectedList
Gets a boolean array indicating which choices are selected. Each element corresponds to whether that choice is selected (true) or not (false).
No code sample available
choiceContentindex: number
Gets the string content for choice with the provided index.
# Sets the point label used to label a bar in a bar
# graph based on the choice selected. If nothing is
# selected the label will show "?".
pointLabel("P_2"):
  when choice1.isSelected(1) choice1.choiceContent(1)
  when choice1.isSelected(2) choice1.choiceContent(2)
  when choice1.isSelected(3) choice1.choiceContent(3)
  otherwise "?"
Next Up: Note

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:reorder

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Ordered List
6 sinks5 sources
initialOrder
Takes a numberList of where each item should start. Accepts any numberList as an order (with ties leaving two items in order). For example, [3, 1, 2] would mean that the first authored item would go in the last slot, the 2nd in the first slot, and the 3rd in the middle slot. [.25, 0, .25] would mean that the 2nd item goes first, the 1st goes right after, and the 3rd stays 3rd. As soon as a student reorders, the response is locked in and this sink is ignored.
# This code sets the initial order of the component
# using the numeric value at each element of the list
# i_{ndex} in the graph
​
initialOrder: graph1.numberList("i_{nitial}")
​
# Note: the order of the list ([3, 1, 2]) does not determine the order 
# of the component. i.e. the initial order will not be the third item followed
# by the first, then the second. Instead it assigns a spot for each item.
# The first item will start in the third position, the second item will start 
# in the first position, and the last item will start in the second position.
itemContentitemIndex: number
Sets the content for a given item, indexed starting with 1. (This only works if the item at this index exists.)
# Set the content of the item in the third place conditionally
itemContent(3):
# If the points overlap (i.e. no line), display "create your line"
  when graph1.number("x_1") = graph1.number("x_2") and graph1.number("y_1") = graph1.number("y_2") "Create your line."
# Once a line is created, display the equation created in the graph.
  otherwise graph1.script.equation
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# This places a check in the summary tab
# of the dashboard as long as the first item is
# in the first position. The location of the
# remaining items do not matter.
correct: this.itemAtIndex(4) = 4
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# Creates a warning in the dashboard when the output
# string is not blank.
warning: 
# When the items are ordered according to the image size, display the following warning:
  when this.itemAtIndex(1) = 2 and this.itemAtIndex(2) = 3 "Student might be using the image size instead of actual size."
# If not, don't show a warning.
  otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# This sink indicates that there is no student
# work on this component that needs scoring.
readOnly: true
hidden
When true, this component will not be shown to students.
# Hides the component when the first choice
# in the multiple choice component
# (show) is not selected.
hidden: not(mc1.isSelected(1))
matchesKey
Returns whether this matches the key (if provided).
# Creates a variable in the graph "I" and
# sets it to 1 when the order of the items 
# matches the answer key (created in editing)
# and sets it to 0 when it doesn't match.
​
number("I"): when order1.matchesKey 1 otherwise 0
order
Returns a numberList of where each item currently is (indexOfItem).
# Create a numberList using the order of the 
# items in the component.
​
numberList("L"): order1.order
itemAtIndexitemIndex: number
Returns the starting item index of the item that's at the given index (indexed starting with 1).
# This places a check in the summary tab
# of the dashboard as long as the first item is
# in the first position. The location of the
# remaining items do not matter.
correct: this.itemAtIndex(4) = 4
textAtIndexitemIndex: number
Returns the string for the item that's at the given index (indexed starting with 1).
# Insert into the content of this note the names of the fruits
# that are listed first (textAtIndex(1)) and last (textAtIndex(5)).
​
content:
"Order the following fruits from least tasty to most tasty.
​
You said that the ${order1.textAtIndex(5)} was the most tasty and the ${order1.textAtIndex(1)} was the least tasty. 
​
Discuss your opinion with a partner."
indexOfIteminitialItemIndex: number
Returns the sorted index of the item that started with the given index (indexed starting with 1).
# Take the current index of the first item (apple = 1) 
# and convert it into a term that makes sentence in line
# with the rest of the note.
position = 
  when order1.indexOfItem(1) = 5 ""
  when order1.indexOfItem(1) = 4 "second "
  when order1.indexOfItem(1) = 3 "third "
  when order1.indexOfItem(1) = 2 "fourth "
  otherwise "fifth "
​
# Insert the "position" variable into the note using ${ }.
​
content:
"Order the following fruits from least tasty to most tasty.
​
You said that the apple was the ${position}tastiest. 
​
Discuss your opinion with a partner."
Next Up: Polygraph

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:polypad

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Polypad
8 sinks2 sources
narrationnarrationIndex: number
Text that screen readers will read aloud. Similar to image alt text, narration can be used to describe a polypad. As with the graph narration sink, you can include multiple narrations for a polypad to separate pieces of information from one another. This allows you to modify narrations independently and minimizes the amount of text a screen reader needs to speak.
# This sink defines what students with vision-impairment will
# hear when they use screen readers. Use multiple narration sinks
# to separate static and dynamic narrations.
​
narration(1): "A single six-sided number cube."
narration(2): "The cube shows the value ${this.value("value").elementAt(1)}."
initialState
Sets the initial Polypad state. This will not affect the customization options in the settings menu.
# Set the initial state of this Polypad
# to match the state of polypadInitial.
​
initialState: polypadInitial.polypadState
textVariabletextVariableName: string
Sets a Polypad text variable. Text variables can be used to set the content of a text tile.
No code sample available
resetOnChange
Specify a string value. If that value changes, the component resets.
No code sample available
hidden
When true, this component will not be shown to students.
# Use hidden to set the condition for hiding a component.
# It will still run in the background, but it will be
# hidden from a student's screen.
​
hidden: hiddenChoice.isSelected(2)
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
triangleCorrect = this.value("triangleCorrect")
squareCorrect = this.value("squareCorrect")
pentagonCorrect = this.value("pentagonCorrect")
​
# Sets the screen's "correct" sink to "true" if
# the student has matched all three shapes correctly.
​
correct: triangleCorrect and squareCorrect and pentagonCorrect
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# This will set a warning on the Teacher Dashboard. When
# the message is set to blank ("") it will hide the warning.
​
warning:
  when this.value("sum") > 200 "Student has created a total greater than 200."
  otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# readOnly determines whether the dashboard should be
# showing any form of correctness. Here, we have set
# "readOnly" as an example. Simply type
# "readOnly: true" if you do not want any information
# from the component to show in the dashboard.
​
readOnly: readOnlyChoice.isSelected(2)
polypadState
Gets the full state of a Polypad. Pass this, for example, into the Polypad's initialState sink.
# Set the initial state of this Polypad
# to match the state of polypadInitial.
​
initialState: polypadInitial.polypadState
isInitialState
Gets a Boolean value that indicates whether the student has interacted with the Polypad.
# Here we hide the note component when the Polypad
# component has not been interacted with.
​
hidden: polypad.isInitialState
Next Up: Screen

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:screen

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Screen
5 sinksno sources
title
Overrides the provided title with a string value. You can use string interpolation (e.g., "hello ${ name }") and conditionals to build rich text to show to the user. Note: We recommend including placeholder text as the display content, which will appear in the miniscreen, teacher dashboard, and teacher guide.
# This sets the title of the screen to say "Hi"
# followed by whatever is typed into the input
# field and an exclamation point. 
# Note: ${} is used here to bring the content from
# the input and place it inside of the string.
title: "Hi ${inputName.content} !"
subtitle
Adds a subtitle that is centered under the screen title.
# This code creates a subtitle that provides
# more information to the student. Unlike titles,
# subtitles can display math formatted text by
# writing out the latex and wrapping it in ``.
subtitle: "Your rocket has been flying for `${inputName.timeSinceSubmit()}` seconds."
coverText
Covers the screen with the text provided. The cover is dismissable.
# Creates a cover for the screen and displays
# the assigned text. A button is also present
# and pressing the button will remove the cover.
coverText: "On this screen you will write your name on a rocket and press a button to make it fly."
coverButtonLabel
Use in conjunction with coverText to change the button text from the default ("Ok"). If set to an empty string, the cover won't be dismissable.
# Cover text must be created to bring up the cover.
coverText: "On this screen you will write your name on a rocket and press a button to make it fly."
​
# This code sets the label of the button that removes
# the cover. Typing a blank string ("") will hide it.
coverButtonLabel: "Try It"
disableCalculatorReason
If provided, disables the calculator tool.
# If the scientific calculator is enabled
# in this activity, this code will disable the 
# calculator on this screen for the reason provided.
disableCalculatorReason: "This screen does not require the use of a calculator."
Next Up: Sketch

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:sketch

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Sketch
24 sinks11 sources
smartStrokeJoining
Perform mutations on mouseup: removing nearby points and joining with other strokes. Most useful when sketch is used for curve sketching, e.g. in Function Carnival. Defaults to false.
# Joins nearby endpoints in the sketch when the first choice
# in the multiple choice component is selected.
   
smartStrokeJoining: when mc1.isSelected(1) true otherwise false
​
​
​
allowEraser
Sometimes you only want students to be able to clear, not erase. Set this to false if that's the mood you're in.
# Setting allowEraser to false hides the eraser tool.
​
allowEraser: false
disableSketch
Sets whether drawing on a sketch is permitted.
# This code will disable the ability to manipulate
# the sketch component after 5 strokes have been made.
​
disableSketch: this.sketch.strokeCount >= 5
hideSketch
Hides the student's sketch. Also disables sketching since anything sketched would be hidden.
# Hides what the student has sketched and disables sketching when the second choice
# in the multiple choice component "sketchChoice" is selected.
​
hideSketch: sketchChoice.isSelected(2)
initialTool
Sets the starting tool.
# Sets the sketch tool that is initially selected
# to the line tool. Here sketchTools is used to
# access the type "line".
​
initialTool: sketchTools.line
initialColor
Sets the starting color.
# Sets the sketch color that is initially
# selected to purple. Here colors is used to
# access the different colors,
​
initialColor: colors.purple
availableColors
Configures the available colors in sketch.
# Create a list of colors using colors.list
# assign that list of colors to the availableColors
# sink to make a custom palette.
​
availableColors: colors.list(colors.red, colors.green, rgb(163,104,229))
numberidentifier: latex
If the sketch has a graph background, sets the value of a variable in the calculator. This will override any existing definitions of that variable.
# This code uses the number source from graph1
# to create a matching value in this sketch component.
# The variable is used to control the spacing between gridlines.
​
number("a"): graph1.number("a")
​
​
# Set the bounds of this sketch component using the variables
# x_m, x_M, y_m, y_M in graph1.
​
bounds: makeBounds(graph1.number("x_m"), graph1.number("x_M"), graph1.number("y_m"), graph1.number("y_M"))
​
numberListidentifier: latex
If the sketch has a graph background, sets a variable in the calculator to the contents of a list. This will override any existing definitions of that variable.
# This code uses the numberList source from graph1
# to create a matching list in this sketch component.
# The list is used to control the spacing between gridlines.
​
numberList("L"): graph1.numberList("L")
​
# Set the bounds of this sketch component using the variables
# x_m, x_M, y_m, y_M in graph1.
​
bounds: makeBounds(graph1.number("x_m"), graph1.number("x_M"), graph1.number("y_m"), graph1.number("y_M"))
​
expressionidentifier: latex, ...allowedSymbols: latex
If the sketch has a graph background, sets a variable in the calculator to an expression with the provided latex. This will override any existing definitions of that variable. The first parameter is the name of the variable or function to be defined. The optional additional parameters specify the symbols that the latex expression is allowed to reference. (By default, it will not be allowed to reference any existing variables or functions in the calculator.)
No code sample available
pointLabelidentifier: string
If the sketch has a graph background, sets a label for a point on the graph. This only works for points defined like A=(1,2), and the identifier needs to match the name given to the point (A in this case). Takes a string. The label next to the point exactly matches the provided string, so the label is turned off if the empty string is provided.
# This code sets the labels of two points
# "A" and "B" in the sketch.
​
# When column 1 is blank, show "A" to identify the figure.
# Once a student enters text, show that text.
pointLabel("A"): 
  when isBlank(table1.cellContent(1,1)) "A" 
  otherwise table1.cellContent(1,1) 
​
# when column 2 is blank, show "B" to identify the figure.
# Once a student enters text, show that text.
pointLabel("B"): 
  when isBlank(table1.cellContent(1,2)) "B" 
  otherwise table1.cellContent(1,2) 
xAxisLabel
If the sketch has a graph background, sets the string we display along the x-axis.
# This will look at certain cells in a table
# and use the contents there to set the x-axis
# label.
​
xAxisLabel: "Time (${xAxisLabelTable.cellContent(1,1)})"
yAxisLabel
If the sketch has a graph background, sets the string we display along the y-axis.
# This will look at certain cells in a table
# and use the contents there to set the y-axis
# label.
​
yAxisLabel: "Remaining Ice Cream (${yAxisLabelTable.cellContent(1,1)})"
audioTraceReverseExpressions
If the sketch has a graph background, specifies whether expressions are traversed in reverse order when audio trace is active. This behavior may be desired in situations where the curves you wish a student to examine are declared at the end of the calculator's expression list so that they appear in the foreground.
# In audio trace mode, navigates the 
# expressions in reverse order when 
# set to true.
audioTraceReverseExpressions: true
​
trace
If the sketch has a graph background, allows tracing curves to inspect coordinates and shows point coordinates when clicked.
# When trace is set to false it prevents
# any sort of tracing the on the graph or the
# selecting of points in the background layer.
​
trace: false
narrationnarrationIndex: number
Text that screen readers will read aloud. Similar to image alt text, narration can be used to describe a graph or sketch. Example: narration: "The graph shows a plot of time studied (in hours) on the x-axis and test scores on the y-axis." You can include multiple narrations for a graph to separate pieces of information from one another. Example: narration(1): "A description of the graph's main characteristics would go here." narration(2): "The line does not pass through all of the points." In the above example, narration(2) could change as the student interacts with the activity without needing to modify the graph description in narration(1). Separating narrations also minimizes the amount of text a screen reader needs to speak.
# This narration tells the user how many strokes have been made in the component.
narration(1): "${this.sketch.strokeCount} strokes"
bounds
Sets the bounds of this sketch. If the sketch has a graph background, it will be updated to match.
# This code uses a makeBounds function and the bounds sink 
# to set the window bounds of the sketch component.
​
bounds: makeBounds(-5,15,-15,5)
​
background
Sets the background of the sketch.
# This code brings the graph from this screen into the
# sketch as a background layer.
​
background: graphLayer(graph.calculatorState)
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# Creates a check mark in the summary tab of the teacher dashboard
# when the total stroke length of the sketches is between 6.6 and 6.8.
​
correct: this.sketch.totalStrokeLength > 6.6 and this.sketch.totalStrokeLength < 6.8
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# Creates a warning message in the summary
# screen of the teacher dashboard
​
warning:
# As long as the number of strokes is less than 
# 2 no warning is required
  when this.sketch.strokeCount < 2 ""
# As soon as there is more than one stroke in the
# sketch we alert the teacher.
  otherwise "More than one stroke is used."
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# Marks this component as read-only, meaning
# that there is no student work to be scored.
readOnly: true
​
hidden
When true, this component will not be shown to students.
# This code hides the sketch component when
# "yes" is selected in the choice component.
​
hidden: choice1.isSelected(1)
functionidentifier: latex
Sets the output of simpleFunction() to a variable defined in the graph.
# Get the latex string from "equationInput" and assign
# it to f in the calculator.
​
function("f"): simpleFunction(equationInput.latex, "x")
resetOnChange
Specify a string value. If that value changes, the component resets.
# Merges the current sketch and the existing sketch into
# a single sketch layer.
totalSketch = mergeSketches(this.sketch,this.currentStroke)
​
# Resets the sketch when the total number of strokes is greater than one
resetOnChange: when totalSketch.strokeCount < 2 "0" otherwise "1"
numberlatex: latex
If the sketch has a graph background, gets the numerical value of a variable in the graph.
# This subtitle will display the slope of the line, 
# calculated in the sketch component as the number "M".
​
# As long as the line is at least 1.5 long, display the slope.
# If the slope is undefined, say so.
# Otherwise, give instructions to sketch a line.
subtitle: 
  when sketch1.sketch.totalStrokeLength > 1.5 and sketch1.number("v_{ertical}") = 1 "Your line is vertical."
  when sketch1.sketch.totalStrokeLength > 1.5 "Your line has a slope of ${sketch1.number("M")}"
  when sketch1.sketch.totalStrokeLength > 0 "Sketch a longer line."
  otherwise "Sketch a line."
  
numberListlatex: latex
If the sketch has a graph background, gets the list of numbers that was assigned to the variable in the graph.
# This subtitle will display the number of gridlines, 
# the line passes through, borrowing a list from the sketch.
​
# As long as something is sketched, display the slope.
# Otherwise, give instructions to sketch the line.
subtitle: 
  when sketch1.sketch.totalStrokeLength > 0 
  "Your line passes through ${length(sketch1.numberList("X"))} gridlines."
  otherwise "Sketch a line."
calculatorState
Gets the full state of a graph. Pass this, for example, into the graphLayer method.
No code sample available
bounds
Gets the bounds of a sketch component.
# Define the bounds of this graph component
# to match the bounds of the sketch background.
​
bounds: sampleSketch.bounds
labelTextidentifier: string
If the sketch has a graph background, gets the text content from a point label in the graph based on the name of the point.
# This code displays the exact text written in the
# label of a point.
cellContent(1,1): sketch1.labelText("P")
​
# If the point's label is written as math using ``,
# the latex will be printed here:
cellContent(1,2): "`${sketch1.labelLatex("P")}`"
​
# This code will display the numeric value of whatever
# is typed into the point label.
cellContent(1,3): "${sketch1.labelNumericValue("P")}"
labelLatexidentifier: string
If the sketch has a graph background, gets the inner latex content from a point label in the graph based on the name of the point.
# This code displays the exact text written in the
# label of a point.
cellContent(1,1): sketch1.labelText("P")
​
# If the point's label is written as math using ``,
# the latex will be printed here:
cellContent(1,2): "`${sketch1.labelLatex("P")}`"
​
# This code will display the numeric value of whatever
# is typed into the point label.
cellContent(1,3): "${sketch1.labelNumericValue("P")}"
labelNumericValueidentifier: string
If the sketch has a graph background, evaluates the content of a point label in the graph based on the name of the point.
# This code displays the exact text written in the
# label of a point.
cellContent(1,1): sketch1.labelText("P")
​
# If the point's label is written as math using ``,
# the latex will be printed here:
cellContent(1,2): "`${sketch1.labelLatex("P")}`"
​
# This code will display the numeric value of whatever
# is typed into the point label.
cellContent(1,3): "${sketch1.labelNumericValue("P")}"
sketch
Gets a sketch object that represents everything drawn on the sketch.
content:
    # Ask the student to create a sketch if they haven't sketched anything.
  when sampleSketch.sketch.strokeCount = 0 "Sketch something."
  otherwise "Thanks!"
currentStroke
Gets a sketch object that represents the current stroke in progress.
content:
    # Ask the student to sketch something and change the note to "sketching..."
    # while they are actively sketching.
  when sampleSketch.currentStroke.totalStrokeLength = 0 "Sketch something."
  otherwise "sketching..."
currentX
Gets the current x-coordinate of the mouse. Works on hover with a mouse and while depressed for touch.
# Use a subtitle sink to display the current 
# x-coordinate of the cursor on the sketch component.
# A ${ } is used to put the number into a string.
​
subtitle: "Current `x`: `${sampleSketch.currentX}`"
currentY
Gets the current y-coordinate of the mouse. Works on hover with a mouse and while depressed for touch.
# Use a subtitle sink to display the current 
# y-coordinate of the cursor on the sketch component.
# A ${ } is used to put the number into a string.
​
subtitle: "Current `y`: `${sampleSketch.currentY}`"
Next Up: Table

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:table

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Action Button
Card Sort
Challenge Creator
Free Response
Graph and Graphing Calc
Image
Math Response
Media
Multiple Choice and Checkboxes
Note
Ordered List
Polygraph
Polypad
Screen
Sketch
Table
Advanced
Index
Table
13 sinks4 sources
maxRows
Sets the number of rows the table will display.
# Sets the maximum number of rows allowed
# in the table to 5.
​
maxRows: 5
disableRowChanges
Sets a Boolean value that indicates whether or not the student can add or remove rows. Similar to fill-in-the-blank mode, but allows for existing cells to be edited. Highly recommended for use with any cell specific sources. (e.g., cellContent or cellNumericValue.)
# The ability to add rows will be disabled when
# the first multiple choice option is selected.
​
disableRowChanges: choice.isSelected(1)
cellContentrowIndex: number, columnIndex: number
Sets the contents of a cell given the row index and column index of the cell. (Row index 1 is the first row underneath the header.)
# Sets the content of cell 1 to the area calculated in the graph.
cellContent(1,1): "${graph.number("A_{rea}")}"
​
# Sets the content of cell 2 to the perimeter calculated in the graph.
cellContent(1,2): "${graph.number("P_{erimeter}")}"
cellSuffixrowIndex: number, columnIndex: number
Adds a suffix to everything entered by the student. Recommended for inputs that expect a certain unit (e.g., ft. or %). Only shows up for expression types of cells.
# Sets the suffix of cell 1 to "square feet" when plural
# and "square foot" when singular.
​
cellSuffix(1,1): 
  when this.cellNumericValue(1,1) = 1 or this.cellNumericValue(1,1) = -1 "square foot" 
  otherwise "square feet"
​
# Sets the suffix of cell 2 to "feet" when plural and
# "foot" when singular.
​
cellSuffix(1,2): 
  when this.cellNumericValue(1,2) = 1 or this.cellNumericValue(1,2) = -1 "foot" 
  otherwise "feet"
cellErrorMessagerowIndex: number, columnIndex: number
An error to show to the student. Note: This will not show up in the teacher dashboard. (Use the "warning" sink to show warnings to the teacher.)
# Displays a warning sign that can be hovered
# to reveal the message "Enter a positive number".
# When a student enters anything other than a positive 
# number. If a positive number is entered, an empty
# string is given indicating no error present.
​
cellErrorMessage(1,1): when this.cellNumericValue(1,1) > 0 "" otherwise "Enter a positive number." 
cellErrorMessage(1,2): when this.cellNumericValue(1,2) > 0 "" otherwise "Enter a positive number." 
initialCellContentrowIndex: number, columnIndex: number
Sets the initial value of the cell at the row index and column index provided. This will unlock the cell and students can override the initial value. Note: Should be a valid latex string if setting for a math type of cell (default).
# Sets the content of each of the cells (row, column) 
# to any string. In this case, the numbers shown below.
​
initialCellContent(1,1): "5"
initialCellContent(2,1): "-7"
initialCellContent(3,1): "-4"
initialCellContent(4,1): "-7"
initialCellContent(5,1): "5"
​
initialCellContent(1,2): "-6"
initialCellContent(2,2): "-5"
initialCellContent(3,2): "3"
initialCellContent(4,2): "3"
initialCellContent(5,2): "4"
cellEditablerowIndex: number, columnIndex: number
Overrides all other mechanisms of deciding whether the student can edit this cell.
# Disables the ability to focus on these cells
# while the animation is playing.
​
cellEditable(1,1): button.timeSincePress() = 0
cellEditable(1,2): button.timeSincePress() = 0 
cellDisableEvaluationrowIndex: number, columnIndex: number
Disable the evaluation of math typed by the student in this cell. Only affects cells in math type columns.
# When set to true, this sink won't display the value of an
# expression, which is especially useful when finding the value
# of an expression is the point of the question.
​
cellDisableEvaluation(1,1): true
​
correct
Sets a Boolean value that determines whether or not a gray checkmark is displayed for the student's screen in the dashboard's summary view.
# This sink will mark this screen as correct on the
# teacher dashboard if the conditions that follow are met.
​
correct: 
  (this.cellNumericValue(1,1) = 8 and this.cellNumericValue(1,2) = 3) or
  (this.cellNumericValue(1,2) = 8 and this.cellNumericValue(1,1) = 3)
warning
Sets a string that is displayed as a tooltip in the teacher dashboard attached to a warning icon.
# Throw a warning when students haven't entered a defined
# linear equation in the table.
warning:
  when not(isDefined(xyLine(lineTargetTable.cellContent(2,2)))) "You have to enter the equation of a line."
  otherwise ""
readOnly
Sets a Boolean value that determines whether or not a component will be ignored when determining a screen's correctness. If all components have a readOnly value of "true," we display a dash for the student's screen in the dashboard's summary view, indicating teachers can focus their efforts elsewhere.
# This code indicates that there is no student work done
# in this component. 
​
readOnly: true
hidden
When true, this component will not be shown to students.
# Hides the table when the first choice
# in the multiple choice component
# (show) is not selected.
hidden: not(mc1.isSelected(1))
resetOnChange
Specify a string value. If that value changes, the component resets.
# Resets and clears the editable cells each time
# the button is pressed.
​
resetOnChange: "${button.pressCount}"
cellContentrowIndex: number, columnIndex: number
Gets the contents of a cell given a row index and column index. (Row index 1 is the first row underneath the header.)
# Sets the label of two points to the strings
# typed into two table cells.
​
pointLabel("F_4"): fruitTable.cellContent(4,1)
pointLabel("F_5"): fruitTable.cellContent(5,1)
cellNumericValuerowIndex: number, columnIndex: number
Gets the evaluated numeric value of that cell given a row index and column index. (Row index 1 is the first row underneath the header.) If a student types "2 + 2", we will return "4".
# Define the numbers X_1 and Y_1 using the
# numeric values in each of the columns
# "x" and "y" in "table1".
​
number("X_1"): table1.cellNumericValue(1,1)
number("Y_1"): table1.cellNumericValue(1,2)
columnNumericValuescolumnIndex: number
Gets the evaluated contents of each cell in a column and returns it as a number list given the column's index.
# Define the number lists X_1 and Y_1 using all of
# the numeric values in each of the columns
# "x" and "y" in "table1".
​
numberList("X_1"): table1.columnNumericValues(1)
numberList("Y_1"): table1.columnNumericValues(2)
cellHasFocusrowIndex: number, columnIndex: number
Gets a Boolean value that indicates whether or not the student is editing a cell given the row index and column index of the cell. (Row index 1 is the first row underneath the header.)
# Sets variables in the calculator in the calculator to 1 or 0
# depending on whether or particular cell in a table is
# focused or not. The calculator then uses those variable to
# change the display of the bar graph.
​
number("F_{1focus}"): when fruitTable.cellHasFocus(1,2) 1 otherwise 0
number("F_{2focus}"): when fruitTable.cellHasFocus(2,2) 1 otherwise 0
number("F_{3focus}"): when fruitTable.cellHasFocus(3,2) 1 otherwise 0
number("F_{4focus}"): when fruitTable.cellHasFocus(4,1) or fruitTable.cellHasFocus(4,2) 1 otherwise 0
number("F_{5focus}"): when fruitTable.cellHasFocus(5,1) or fruitTable.cellHasFocus(5,2) 1 otherwise 0
​
Next Up: Advanced

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#graphs

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Graphs and Sketches
Aggregate
Interpreting Math
Random Numbers
Index
Graphs and Sketches
Our graphing calculator is the secret engine behind a lot of Computation Layer's power. Sketches can benefit from this power as well, especially if you set the background of the sketch to be a graph.
Note that these features work best when you're using the graph component rather than the graphing calculator. The former hides the expressions list, while the latter includes it. Using CL with the graphing calculator will give warnings because we can't make guarantees about which variables will exist since a student could delete or duplicatively define named variables.
Numbers, NumberLists, and PointLabels
There are three main ways to get data into and out of graphs: numbers, numberLists, and pointLabels. Numbers are a single value, numberLists are a list of values, and pointLabels take a string. In each case, you can only read and write to named values. For example, if you make a point A=(1,n), turn on its label, and then use CL, you can both dynamically place and label the point like this:
#position the point
number("n"): exp1.numericValue
​
#label the point. Note that I'm using the LaTeX type so that it'll format as math.
#if you use "" instead of `` it'll look like plaintext
pointLabel("A"): `n = ${exp1.numericValue}`
Note that number and numberList overwrite the value in the graph for the named variable. It's okay to put dummy data in the graph, just know that it'll get replaced when CL runs.
You can also pass in a numberList to a named variable. For example, the "history" sink on a button returns a numberList. You could leave a trail of every place that a point has been using capture/history in combination with number/numberList. If the graph is named "g1" and the button is named "b1", here's what you'd write in the button's script:
#capture the current values of the point
capture("a"): g1.number(`a`)
capture("b"): g1.number(`b`)
And here's what you'd write in the graph's script:
#populate the list of prior points from the button history
numberList("A"): b1.history("a")
numberList("B"): b1.history("b")
Animating Graphs
Many things in Desmos activities that look like videos are actually just animated graphs. To add a play button on top of a graph, just use the animationDuration sink. That sets how long the animation will play. You can then read off the animationTime sink and inject that straight into the graph. For example:
#this is a 5 second animation
animationDuration:5
​
#take the animationTime and inject it in
number("t_0"): this.animationTime
​
#Add in accessibility tied to the animationTime!
narration(1): when this.animationTime > 0 "" otherwise "This graph shows a circle."
narration(2): when this.animationTime = 0 "" otherwise "The original circle splits into two circles, labeled \"Stage 1\". To get to the next stage, every circle splits into two more circles."
narration(3): when this.animationTime = 0 "" otherwise "The animation shows Stages 1 through 4."
Interpreting Sketches
At first glance, it might seem like sketches are similar to free response text and that there isn't anything interesting to extract from them. But sketches are full of rich data that you can connect to other representations.
For example, you can read off the number of strokes and points. You can also grab every value of a sketch at a given x-value. You can combine all of these features together to make a lightweight version of Function Carnival. Start by making a graph (g1) and sketch (s1).
Add this script for the graph:
animationDuration: 10
​
number("t"): this.animationTime
numberList("L"): s1.sketch.yValuesAt(this.animationTime)
And add this script for the sketch:
#this draws a vertical line in the sketch)
number("t"): g1.animationTime
​
#only show the message before you've drawn
#by looking at currentStroke, we also hide the message as soon as you start sketching
number("v"): 
  when (this.sketch.strokeCount = 0 and this.sketch.pointCount = 0 and this.currentStroke.strokeCount = 0) 1
  otherwise 0
Layers and Transformations
You can add layers behind graphs and sketches using the "background" sink. Combine this with transformations that you can do on sketches to build some fun interactives.
For example, you could have students sketch something and then animate their sketch offscreen when they press a button:
isAnimating = btn.timeSincePress > 0
​
#disallow sketching
disableSketch: isAnimating
#and hide the sketch (the background will show it instead)
hideSketch: isAnimating
​
#transform the sketch:
xTransform = simpleFunction("x+${btn.timeSincePress}","x","y")
yTransform = simpleFunction("y","x","y")
​
background: sketchLayer(this.sketch.transform(xTransform,yTransform))
Next Up: Aggregate

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#interpreting-math

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Graphs and Sketches
Aggregate
Interpreting Math
Random Numbers
Index
Interpreting Math
We love when students can express themselves in a variety of ways. Unfortunately, this means extra work for you in building CL scripts that can interpret all of that flexibility. This section can hopefully provide some useful ideas. But first, some principles we like to adhere to:
Never incorrectly mark a student wrong!
Try to interpret everything students might type.
Always test your scripts by trying out lots of student responses before sharing with students.
For example, we almost always prefer to look at numericValue from an input rather than expect the exact characters. Not only does this avoid creating bugs when, for example, a student inadvertently types a space, it also invites and celebrates writing expressions (e.g., 4+5) instead of just numbers (e.g., "9").
Example 1: simpleFunction
One powerful way to interpret math is to use our graphing calculator. But this can be challenging. Suppose we want a student to write the equation of a line that passes through the point (1, 3). Here, you could make use of "simpleFunction." That will understand an equation of the form y=3x, or f(x)=3x, or even just 3x. Here's the script in the graph:
#this just says "don't worry about this for correctness"
readOnly: true
​
#use the function sink. We can then check for correctness easily
function("f"): simpleFunction(exp1.latex)
​
And here's the script on the input:
#to check correctness, we're just going to look at the correctness value computed in the graph.
#C is computed to be 1 if correct and 0 otherwise
correct: graph1.number(`C`) = 1
​
Example 2: parseEquation
Pretty good! But unfortunately simpleFunction requires a line to be written in explicit form. A line like x+y=4 is correct, but simpleFunction doesn't detect it! Another option is to parse the equation and look at the difference function. This one's subtle, so we recommend looking at the graph. This will turn the student equation of x+y=4 into f(x,y) = 4-(x+y). Here's what this looks like in the graph's CL script:
#this just says "don't worry about this for correctness"
readOnly: true
​
#use the function sink. We can then check for correctness easily
function("f"): parseEquation(exp1.latex).differenceFunction("x", "y")
​
There are other options too, like the xyLine method, which naturally understands all different forms of lines, but won't work for parabolas, for instance. The method of parsing you use depends on the math you're hoping for. Unfortunately, there's no one size fits all.
Using Patterns
Those first examples show how to provide feedback on student responses by numerically evaluating the students' responses. Sometimes you also want to check their exact form. For this, you can try exploring our "patterns" feature, which lets you parse expressions into pieces. Warning: Be very cautious with this feature! It's under development. It's also really easy to accidentally mark student thinking incorrect when it's just in an unexpected form.
Here's an example of how to check that a response is a simple number. Note that in Desmos, a "number" is a decimal, a fraction, or a mixed number.
#this checks whether their expression is just a number. Will exclude e.g. 4+4
isJustANumber = patterns.number.matches(this.latex)
​
#turn off evaluation
disableEvaluation: true
​
#mark correctness
correct: this.numericValue = 10
​
#give the student actionable feedback
submitDisabled: not(isJustANumber)
errorMessage:
  when isJustANumber ""
  otherwise "Enter a number."
You can also pull apart different parts of their expression using patterns. For example, we could grab the numerator and denominator of a fraction as follows:
#this says: look for a number divided by a number.
pattern = patterns.fraction(patterns.number, patterns.number)
​
#check validity
isValid = 
  when pattern.matches(exp1.latex) "yes"
  otherwise "no"
 
#read off the numerator and denominator. sorry this is verbose!
numerator = pattern.parse(exp1.latex).numerator.latex
denominator = pattern.parse(exp1.latex).denominator.latex
Patterns are a beta feature and you should use them carefully! We expect to make them easier to use over time and will be expanding our documentation as we do.
Next Up: Random Numbers

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#random

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Graphs and Sketches
Aggregate
Interpreting Math
Random Numbers
Index
Random Numbers
Computation Layer supports random numbers. Random numbers are unique but stable for each student. This means that page reloads won't change the random numbers. However, every student will see a different set of random numbers. You can use this, for example, to give each student a different problem:
r = randomGenerator()
​
A = r.int(-12,-2)
B = r.int(3,7)
​
#evaluate C
C = numericValue(`${A}*${B}`)
​
#create a random equation 
#wrapped in backticks so that it will be rendered with CL
equation = `${A}x+${B}y=${C}`
In the above example, the numbers were created in the note component, but you can grab them off of the note's script keyword to, for example, evaluate correctness on the math input:
correct: this.numericValue = note1.script.B
The randomGenerator can also take an argument, called a "seed." This lets you change which random numbers a student sees (e.g., hooking up a button to produce a series of random problems):
r = randomGenerator(btn1.pressCount)
​
a = r.int(-20,20)
b = r.int(-20,20)
​
#beautiful prompt, taking into account the - in b if it's negative
prompt =
  when b >= 0 `${a}+${b}`
  otherwise `${a}${b}`
Here we can again evaluate correctness. This example makes use of the advanced patterns feature (see interpreting math) to ensure that students are typing in only a number:
disableEvaluation: true
isASimpleNumber = patterns.number.matches(this.latex)
​
correct: isASimpleNumber and this.numericValue = numericValue(`${prompt.script.a}+${prompt.script.b}`)
submitDisabled: not(isASimpleNumber)
​
resetOnChange: "${btn1.pressCount}"
​
Note that for many applications the random capabilities of the graphing calculator might be easier and more powerful! Random numbers in the calculator will behave similarly, remaining stable between page loads but different for different students.
Next Up: Index

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#index

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
Other Functions
Deprecated Functions
Index
<(comparators)
<=(comparators)
=(comparators)
>(comparators)
>=(comparators)
Action Button Component
allowEraser(Sketch Sink)
and(logic)
xyLine.angle
animationDuration(Graph and Graphing Calc Sink)
animationKeyboardStepValue(Graph and Graphing Calc Sink)
animationTime(Graph and Graphing Calc Source)
annotationKeyPair.annotationIndex
annotationKeyPair(type)
audioTraceReverseExpressions(Graph and Graphing Calc Sink)
audioTraceReverseExpressions(Sketch Sink)
availableColors(Sketch Sink)
background(Graph and Graphing Calc Sink)
background(Sketch Sink)
colorPalette.black
colorPalette.blue
bounds.bottom
bounds(type)
bounds(Graph and Graphing Calc Sink)
bounds(Graph and Graphing Calc Source)
bounds(Sketch Sink)
bounds(Sketch Source)
buttonStyles(type)
calculatorState(Graph and Graphing Calc Source)
calculatorState(Sketch Source)
capture(Action Button Sink)
capture(Math Response Sink)
Card Sort Component
cellContent(Table Sink)
cellContent(Table Source)
cellDisableEvaluation(Table Sink)
cellEditable(Table Sink)
cellErrorMessage(Table Sink)
cellHasFocus(Table Source)
cellNumericValue(Table Source)
cellSuffix(Table Sink)
Challenge Creator Component
challengeBackground(Challenge Creator Sink)
challengeBounds(Challenge Creator Sink)
challengeText(Challenge Creator Sink)
choiceContent(Multiple Choice and Checkboxes Sink)
choiceContent(Multiple Choice and Checkboxes Source)
clearOnReset(Math Response Sink)
color(type)
colorPalette(type)
columnNumericValues(Table Source)
conic
conic(type)
content(Note Sink)
content(Free Response Source)
correct(Math Response Sink)
correct(Graph and Graphing Calc Sink)
correct(Multiple Choice and Checkboxes Sink)
correct(Polypad Sink)
correct(Ordered List Sink)
correct(Sketch Sink)
correct(Table Sink)
countNumberUsage
coverButtonLabel(Screen Sink)
coverText(Screen Sink)
currentStroke(Sketch Source)
currentX(Graph and Graphing Calc Source)
currentX(Sketch Source)
currentY(Graph and Graphing Calc Source)
currentY(Sketch Source)
buttonStyles.default
evaluationFrame.define
inequality.differenceFunction
equation.differenceFunction
disableCalculatorReason(Screen Sink)
disableChange(Multiple Choice and Checkboxes Sink)
disabled(Action Button Sink)
disableEdit(Math Response Sink)
disableEvaluation(Math Response Sink)
disableRowChanges(Table Sink)
disableSketch(Sketch Sink)
equation(type)
polypadTools.equation
sketchTools.eraser
errorMessage(Math Response Sink)
evaluationFrame.evaluate
mathFunction.evaluateAt
evaluationFrame
evaluationFrame(type)
explainContent(Math Response Source)
explainContent(Multiple Choice and Checkboxes Source)
explainPrompt(Math Response Sink)
explainPrompt(Multiple Choice and Checkboxes Sink)
expression(Graph and Graphing Calc Sink)
expression(Sketch Sink)
sketch.filterByColor
firstDefinedValue(defined-values)
randomGenerator.float
formatLatex
Free Response Component
function(Graph and Graphing Calc Sink)
function(Sketch Sink)
polypadTools.geo
conic.getCoefficient
parabola.getCoefficient
Graph and Graphing Calc Component
graphLayer
colorPalette.green
bounds.height
hidden(Action Button Sink)
hidden(Image Sink)
hidden(Note Sink)
hidden(Math Response Sink)
hidden(Graph and Graphing Calc Sink)
hidden(Free Response Sink)
hidden(Multiple Choice and Checkboxes Sink)
hidden(Polypad Sink)
hidden(Ordered List Sink)
hidden(Sketch Sink)
hidden(Table Sink)
hidden(Media Sink)
hideSketch(Sketch Sink)
annotationKeyPair.highlightKey
history(Action Button Source)
history(Math Response Source)
conic.horizontalParabola
if(See when/otherwise)
Image Component
indexOfItem(Ordered List Source)
inequality(type)
initialCellContent(Table Sink)
initialColor(Sketch Sink)
initialLatex(Math Response Sink)
initialOrder(Ordered List Sink)
initialState(Polypad Sink)
initialText(Math Response Sink)
initialText(Free Response Sink)
initialText(Multiple Choice and Checkboxes Sink)
initialTool(Sketch Sink)
randomGenerator.int
isAnimating(Graph and Graphing Calc Source)
isBlank(defined-values)
isDefined(defined-values)
xyLine.isHorizontal
parabola.isHorizontal
isInitialState(Polypad Source)
inequality.isLeftGreater
isSelected(Multiple Choice and Checkboxes Source)
isSelectedList(Multiple Choice and Checkboxes Source)
inequality.isStrict
isUndefined(defined-values)
xyLine.isVertical
parabola.isVertical
itemAtIndex(Ordered List Source)
itemContent(Ordered List Sink)
label(Action Button Sink)
labelLatex(Graph and Graphing Calc Source)
labelLatex(Sketch Source)
labelNumericValue(Graph and Graphing Calc Source)
labelNumericValue(Sketch Source)
labelText(Graph and Graphing Calc Source)
labelText(Sketch Source)
lastValue(Action Button Source)
lastValue(Math Response Source)
latex(Math Response Source)
layerStack
bounds.left
length
inequality.lhs
equation.lhs
sketchTools.line
buttonStyles.link
colorPalette.list
location(type)
makeBounds(type-constructor)
matchesKey(Card Sort Source)
matchesKey(Multiple Choice and Checkboxes Source)
matchesKey(Ordered List Source)
sketchTools.math
Math Response Component
mathFunction(type)
max(comparators)
maxButtonsPerRow(Multiple Choice and Checkboxes Sink)
maxRows(Table Sink)
maxSelectedChoices(Multiple Choice and Checkboxes Sink)
Media Component
mergeSketches
min(comparators)
polypadTools.move
Multiple Choice and Checkboxes Component
narration(Graph and Graphing Calc Sink)
narration(Polypad Sink)
narration(Sketch Sink)
polypadTools.none
not(logic)
Note Component
number(Graph and Graphing Calc Sink)
number(Graph and Graphing Calc Source)
number(Sketch Sink)
number(Sketch Source)
numberList(Graph and Graphing Calc Sink)
numberList(Graph and Graphing Calc Source)
numberList(Sketch Sink)
numberList(Sketch Source)
numericValue
numericValue(Math Response Source)
or(logic)
colorPalette.orange
order(Ordered List Source)
Ordered List Component
orderedPair(type)
otherwise(See when/otherwise)
parabola(type)
parseEquation(type-constructor)
parseInequality(type-constructor)
parseOrderedPair(type-constructor)
polypadTools.pen
sketchTools.pencil
placeholderLatex(Math Response Sink)
placeholderText(Free Response Sink)
sketch.pointCount
pointLabel(Graph and Graphing Calc Sink)
pointLabel(Sketch Sink)
sketchTools.points
sketch.pointXValues
sketch.pointYValues
Polygraph Component
Polypad Component
polypadState(Polypad Source)
polypadTools(type)
pressCount(Action Button Source)
preventChallengeCreationReason(Challenge Creator Sink)
preventSubmissionReason(Challenge Creator Sink)
prompt(Multiple Choice and Checkboxes Sink)
colorPalette.purple
randomGenerator(type-constructor)
randomGenerator(type)
readOnly(Math Response Sink)
readOnly(Graph and Graphing Calc Sink)
readOnly(Multiple Choice and Checkboxes Sink)
readOnly(Polypad Sink)
readOnly(Ordered List Sink)
readOnly(Sketch Sink)
readOnly(Table Sink)
buttonStyles.red
colorPalette.red
resetAnimationOnChange(Graph and Graphing Calc Sink)
resetLabel(Action Button Sink)
resetLabel(Math Response Sink)
resetOnChange(Action Button Sink)
resetOnChange(Math Response Sink)
resetOnChange(Free Response Sink)
resetOnChange(Multiple Choice and Checkboxes Sink)
resetOnChange(Polypad Sink)
resetOnChange(Sketch Sink)
resetOnChange(Table Sink)
resetStyle(Action Button Sink)
responseBackground(Challenge Creator Sink)
responseBounds(Challenge Creator Sink)
responseText(Challenge Creator Sink)
rgb(type-constructor)
inequality.rhs
equation.rhs
bounds.right
saveOnChange(Graph and Graphing Calc Sink)
sketch.scaleThicknessBy
Screen
sketch.setColor
sketch.setOpacity
color.setOpacity
showExplain(Math Response Sink)
showExplain(Multiple Choice and Checkboxes Sink)
showPeerResponses(Math Response Sink)
showResetButton(Graph and Graphing Calc Sink)
showSubmitButton(Math Response Sink)
showSubmitButton(Free Response Sink)
showSubmitButton(Multiple Choice and Checkboxes Sink)
simpleFunction(type-constructor)
sketch(type)
sketch(Sketch Source)
Sketch Component
sketchLayer
sketchTools(type)
xyLine.slope
smartStrokeJoining(Sketch Sink)
bounds.squareBottom
bounds.squareCenterHorizontal
bounds.squareCenterVertical
bounds.squareLeft
bounds.squareRight
bounds.squareTop
bounds.stretch
sketch.strokeCount
style(Action Button Sink)
submitCount(Math Response Source)
submitCount(Multiple Choice and Checkboxes Source)
submitDisabled(Math Response Sink)
submitDisabled(Free Response Sink)
submitLabel(Math Response Sink)
submitLabel(Free Response Sink)
submitLabel(Multiple Choice and Checkboxes Sink)
submitted(Math Response Source)
submitted(Free Response Source)
submitted(Multiple Choice and Checkboxes Source)
substituteLatexVariable
subtitle(Screen Sink)
suffix(Math Response Sink)
Table Component
sketchTools.text
polypadTools.text
textAtIndex(Ordered List Source)
sketch.textCount
textVariable(Polypad Sink)
time(Media Sink)
time(Media Source)
timeSincePress(Action Button Source)
timeSinceSubmit(Math Response Source)
timeSinceSubmit(Free Response Source)
timeSinceSubmit(Multiple Choice and Checkboxes Source)
title(Screen Sink)
bounds.top
totalCards(Card Sort Source)
totalCorrectCards(Card Sort Source)
sketch.totalStrokeLength
trace(Graph and Graphing Calc Sink)
trace(Sketch Sink)
sketch.transform
parabola.vertex
conic.verticalParabola
warning(Math Response Sink)
warning(Graph and Graphing Calc Sink)
warning(Multiple Choice and Checkboxes Sink)
warning(Polypad Sink)
warning(Ordered List Sink)
warning(Sketch Sink)
warning(Table Sink)
when(See when/otherwise)
buttonStyles.white
bounds.width
orderedPair.x
xAxisLabel(Graph and Graphing Calc Sink)
xAxisLabel(Sketch Sink)
xyLine.xIntercept
parabola.xIntercepts
sketch.xValuesAt
xyLine(type-constructor)
xyLine(type)
orderedPair.y
yAxisLabel(Graph and Graphing Calc Sink)
yAxisLabel(Sketch Sink)
xyLine.yIntercept
parabola.yIntercepts
sketch.yValuesAt

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#logic

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
Other Functions
Deprecated Functions
Logic and Conditionals
CL uses booleans and logical operators (and, or, and not) to show and hide components (using the "hidden" sink) and to otherwise respond to student interactions.
Logical Operators
If you need to express a complicated condition, it can be helpful to combine several simpler conditionals.
and
Takes two booleans and returns true if both are true. Use like "when ___ and ___"
# Store a Boolean value that tells us if the input has been submitted.
submitted = numberTyper.submitted
​
# Store the numericValue of the math input as a variable called n.
n = numberTyper.numericValue
​
# Check to see if the number matches different constraints and assign
# a feedback variable accordingly.
feedback =
  when submitted and n > 2 and n < 4 and not(n = 3) "\n\nNice!"
  when submitted "\n\nNope!"
  otherwise ""
​
content: "Type a number that is greater than 2 and less than 4 and ISN'T 3.${feedback}"
or
Takes two booleans and returns true if either one is true. Use like "when ___ or ___"
No code sample available
not
Takes a boolean and returns its opposite. Use like "when not(___)"
# Store a Boolean value that tells us if the input has been submitted.
submitted = numberTyper.submitted
​
# Store the numericValue of the math input as a variable called n.
n = numberTyper.numericValue
​
# Check to see if the number matches different constraints and assign
# a feedback variable accordingly.
feedback =
  when submitted and n > 2 and n < 4 and not(n = 3) "\n\nNice!"
  when submitted "\n\nNope!"
  otherwise ""
​
content: "Type a number that is greater than 2 and less than 4 and ISN'T 3.${feedback}"
Defined and Undefined Values
When there's no way to answer a question in CL, the value is treated as "undefined". An example of this is asking what line an equation represents when the equation does not represent any line. In these situations, you will usually want to do something different (for example, you might add special instructions to clarify that the student needs to specify a line).
isDefined
Takes any type and returns a boolean for if it's defined. For example, use with the numericValue of an expression input.
# Tries to assign the value in the "numberDefiner" math input to "a"
# first and then plots 4 as a backup if that value is undefined.
number("a"): when isDefined(numberDefiner.numericValue) numberDefiner.numericValue otherwise 4
isUndefined
Takes any type and returns a boolean for if it's undefined. For example, use with the numericValue of an expression input.
# Checks to see if the math input has been submitted and is undefined.
# If that's true it displays an irritated warning. If that's false
# it displays the welcome text.
content:
  when undefinerInput.submitted and isUndefined(undefinerInput.numericValue) "WHAT DID WE SAY?!"
  when undefinerInput.submitted "Thank you. `${undefinerInput.numericValue}` is defined."
  otherwise "Type a defined number in the blank.\n\nWe mean it.\n\nDon't try to type anything undefined."
firstDefinedValue
Takes multiple arguments, all of the same type, and returns the first that's valid. Use, for example as "a = firstDefinedValue(exp1.numericValue, 2)". That will return 2 until exp.numericValue is valid.
# Tries to assign the value in the "numberDefiner" math input to "a"
# first and then plots 4 as a backup if that value is undefined.
number("a"): firstDefinedValue(numberDefiner.numericValue,4)
isBlank
Takes a string and returns a boolean of whether it's the empty string.
# Check to see if the student has entered text into "friendInput"
# and change the feedback display accordingly.
feedback =
  when isBlank(friendInput.content) ""
  otherwise "\n\nHello, ${friendInput.content}."
​
content: "What's your name, friend?${feedback}"
Comparing values
Computation Layer supports comparisons between numbers. You can also grab the max or min of a numberList.
=
No code sample available
>
No code sample available
>=
No code sample available
<
No code sample available
<=
No code sample available
max
Takes a numberList and returns its largest value as a number.
# Create a list using the values in column 1 of the table
# and inject that ist into the graph.
X = table.columnNumericValues(1)
numberList("X"): X 
​
# Find the maximum and minimum values from the list, then
# multiply by a scale factor to add some padding:
left = numericValue("${min(X)}-5")
right = numericValue("${max(X)}+5")
​
# Set the window bounds using the left and right
# values calculated in the previous row.
bounds: makeBounds(left,right,-10,10)
min
Takes a numberList and returns its smallest value as a number.
# Create a list using the values in column 1 of the table
# and inject that ist into the graph.
X = table.columnNumericValues(1)
numberList("X"): X 
​
# Find the maximum and minimum values from the list, then
# multiply by a scale factor to add some padding:
left = numericValue("${min(X)}-5")
right = numericValue("${max(X)}+5")
​
# Set the window bounds using the left and right
# values calculated in the previous row.
bounds: makeBounds(left,right,-10,10)

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#types

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
Types
Every value in the Computation Layer has a type. For example, consider some of the sources and sinks for the Math Input component:
The timeSinceSubmit source produces a number
The latex source produces the LaTeX value of the component
The submitLabel sink expects a string value
The hidden sink expects a true/false value
These examples demonstrate some basic types: numbers, LaTeX, strings, and booleans. However there are other types like sketches, numberLists, colors, etc. Abstractly, a type describes what kind of data is stored in a value, and what operations are available for that value. For example, the numberList type stores a list of numbers, and some of the available operations are to find the length of the list, or to get an element at a specific index.
Computation Layer is a "Strongly typed" language. Every expression produces a value of some type. For example,sketch1.sketch.pointCount produces a value of type number, while the subexpression sketch1.sketch produces a value of type sketch. Whenever you use a value(e.g., in an expression, function call, or sink), we check that is the correct type for that usage, and show an error if it is not (e.g., trying to use a number in a sink that expects a string).
Basic Types
The most common types in the Computation Layer are numbers, strings, LaTeX and booleans.
Numbers represent numeric values
String represent text values
Booleans are true/false values
LaTeX represent written mathematics
Strings are wrapped in quotes (""), while LaTeX is wrapped in backticks (``). One way to see the difference is to observe how they look when inserted into a note. For example:
#this is a regular string:
str1 = "y=x^2"
​
#this is a LaTeX string
str2 = `y=x^2`
​
#you can put LaTeX inside of a string, like so:
str3 = "string outside `y=x^2` string outside"
Complex Types
Complex types, such as sketches, colors, numberLists, etc, store a specific kind of data, and have a set of attributes, or member functions, which you can use to extract data from the type or transform it in some way.
When working with one of these types, you generally need to answer these questions:
What kind of information does this type represent?
How do I obtain values of this type?
What attributes or functions can I use to manipulate this type?
Where can I use this type?
You'll generally get these types from either a component source or a function, transform them by calling additional functions on them, and then use them in a sink or as an argument to another function.
Utility Types
The utility types, sketchTools, buttonStyles, and colorPalette, are designed to provide access to useful objects. For example, the colorPalette type contains standard Desmos colors that can then be used in the initialColor sink for the Sketch component. These types are obtained by referencing a global constant, e.g. colors for the colorPalette type.

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:bounds

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
bounds
Represents the mathematical bounds of a graph or sketch.
Creating:
makeBounds
Create a bounds object given left, right, bottom, top. These bounds will have non-square axis, meaning that when applied to a graph/sketch entity, the entity will be stretched to show exactly these bounds.
# Sets four variables to numbers defined in this graph.
xmin = this.number("T_{opLeftX}")
xmax = this.number("B_{ottomRightX}")
ymin = this.number("B_{ottomRightY}")
ymax = this.number("T_{opLeftY}")
​
# Defines the bounds of the graph component to be
# four Computation Layer variables.
bounds: makeBounds(xmin,xmax,ymin,ymax)
Attributes:
left
Get the left property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
bottom
Get the bottom property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
height
Get the height property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
width
Get the width property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
top
Get the top property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
right
Get the right property from the bounds object
# Get and display bound properties.
​
content:
"Here are some properties of your window.
​
The left bound is: ${boundsCheck.bounds.left}
The bottom bound is: ${boundsCheck.bounds.bottom}
The top bound is: ${boundsCheck.bounds.top}
The right bound is: ${boundsCheck.bounds.right}
The height of the window is: ${boundsCheck.bounds.height}
The width of the window is: ${boundsCheck.bounds.width}"
stretch
Show the bounds exactly, while allowing the aspect ratio to be non-square.
# make the bounds of the graph match the given bounds 
# exactly, even though they won't necessarily be square.
bounds: makeBounds(-10,10,-10,10).stretch()
squareLeft
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, 
# with the left edge going from -10 to 10.
bounds: makeBounds(0,10,-10,10).squareLeft()
squareRight
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, 
# with the right edge going from -10 to 10.
bounds: makeBounds(-10,0,-10,10).squareRight()
squareCenterHorizontal
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, with the 
# y axis in the center, and going from -10 to 10.
bounds: makeBounds(-10,10,-10,10).squareCenterHorizontal()
squareBottom
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, 
# with the bottom edge going from -10 to 10.
bounds: makeBounds(-10,10,0,10).squareBottom()
squareTop
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, 
# with the top edge going from -10 to 10.
bounds: makeBounds(-10,10,-10,0).squareTop()
squareCenterVertical
Force the bounds to have a square aspect ratio, while preserving the provided edge.
# This will force the axes to be square, with the x axis 
# in the center, going from -10 to 10
bounds: makeBounds(-10,10,-10,10).squareCenterVertical()

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:colorPalette

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
colorPalette
Contains the Desmos colors.
Attributes:
red
The color red used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
blue
The color blue used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
green
The color green used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
purple
The color purple used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
orange
The color orange used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
black
The color black used in the Desmos calculator.
# Based on the choice selected, set the initial color
# to one of the 6 Desmos graph colors.
​
initialColor: 
  when choice.isSelected(1) colors.red
  when choice.isSelected(2) colors.blue
  when choice.isSelected(3) colors.green
  when choice.isSelected(4) colors.purple
  when choice.isSelected(5) colors.orange
  otherwise colors.black
list
make a list of colors, e.g. for use in setting available colors in sketch
# Create a list of colors using colors.list and
# assign that list of colors to the availableColors
# sink to make a custom palette. The order you list
# them will be the order they appear in the palette.
​
availableColors: colors.list(colors.red, colors.green, rgb(163,104,229))

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:conic

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
conic
Represents a conic section.
Attributes:
getCoefficient
Get the 3x3 coefficient matrix of a conic where each row represents x terms and each column represents y terms.
# Create a variable for a conic type using the
# latex input from this component.
fn = conic(this.latex)
​
# Get the coefficients in columns 1, 2, and 3 of 
# The first row of the coefficient matrix.
c11 = fn.getCoefficient(1,1)
c12 = fn.getCoefficient(1,2)
c13 = fn.getCoefficient(1,3)
​
# Get The coefficients in columns 1 and 2 of
# the second row of the coefficient matrix.
c21 = fn.getCoefficient(2,1)
c22 = fn.getCoefficient(2,2)
​
# Get the coefficient in column 1 of row 3
# of the coefficient matrix.
c31 = fn.getCoefficient(3,1)
​
verticalParabola
Returns a parabola object if the conic is a parabola aligned to the y axis.
# Create a variable for a conic type using the
# latex input from this component.
# Specify that the conic be a vertical parabola.
fn = conic(this.latex).verticalParabola
​
​
# get the coefficient of the x^2 term from the vertical parabola
a = fn.getCoefficient(3,1)
# get the coefficient of the x term from the vertical parabola
b = fn.getCoefficient(2,1)
# get the coefficient of the constant term from the vertical parabola
c = fn.getCoefficient(1,1)
horizontalParabola
Returns a parabola object if the conic is a parabola aligned to the x axis.
# Create a variable for a conic type using the
# latex input from this component.
# Specify that the conic be a horizontal parabola.
fn = conic(this.latex).horizontalParabola
​
​
# get the coefficient of the y^2 term from the horizontal parabola
a = fn.getCoefficient(1,3)
# get the coefficient of the y term from the horizontal parabola
b = fn.getCoefficient(1,2)
# get the coefficient of the constant term from the horizontal parabola
c = fn.getCoefficient(1,1)

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:inequality

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
inequality
Represents a mathematical inequality.
Creating:
parseInequality
Takes a latex string, e.g. "2x+y>1" - and returns an inequality object. Does not recognize compound inequalities.
# Create a variable for the inequality created
# from the student's input.
inequality = parseInequality(i.latex)
​
# When the inequality is strictly greater than
# or less than, display "strict" otherwise, 
# display "not strict"
strictMsg = when inequality.isStrict "strict" otherwise "not strict"
​
# Uses isLeftGreater to determine which of the two
# sides is greater than the other. If leftIsGreater,
# bigger is set to the left side and smaller is set to
# the right side. If not, the assignments are switched.
bigger = when inequality.isLeftGreater inequality.lhs otherwise inequality.rhs
smaller = when inequality.isLeftGreater inequality.rhs otherwise inequality.lhs
​
# Turn the parsed sides into a function by subtracting
# the lesser side from the greater side.
f = inequality.differenceFunction("x", "y")
​
​
# Create the message to display in the note.
msg = when isDefined(inequality)
"Nice.
I wonder which is bigger: ${inequality.lhs} or ${inequality.rhs}.
Looks like it's ${strictMsg}.
And looks like it's true when ${bigger} is greater than ${smaller}.
"
otherwise ""
​
​
Attributes:
rhs
Latex string for right-hand side of inequality
content:
# Parses and displays separately the 
# left and right hand sides of an inequality.
"Enter an inequality.
​
lhs = `${parseInequality(input.latex).lhs}`
rhs = `${parseInequality(input.latex).rhs}`"
​
​
lhs
Latex string for lef-hand side of inequality
content:
# Parses and displays separately the 
# left and right hand sides of an inequality.
"Enter an inequality.
​
lhs = `${parseInequality(input.latex).lhs}`
rhs = `${parseInequality(input.latex).rhs}`"
​
​
isStrict
True for strict inequality, False for non-strict inequality
# Creates a function by subtracting the lesser side
# of the inequality from the greater side.
function(`f`): parseInequality(input.latex).differenceFunction(`x`,`y`)
​
# Creates a variable in the graph and sets it to 1 when the 
# inequality is strictly less than or greater than, and 0
# when the inequality is less than or equal to or greater than or 
# equal to.
number(`s_{trict}`): when parseInequality(input.latex).isStrict 1 otherwise 0
isLeftGreater
Which way does the inequality point? True for "greater than" and "greater than or equal to"
# Create a variable for the inequality.
inequality = parseInequality(this.latex)
​
# Uses isLeftGreater to determine which of the two
# sides is greater than the other. If the left Is Greater,
# bigger is set to the left side and smaller is set to
# the right side. If not, the assignments are switched.
bigger = when inequality.isLeftGreater inequality.lhs otherwise inequality.rhs
smaller = when inequality.isLeftGreater inequality.rhs otherwise inequality.lhs
differenceFunction
simpleFunction representing for (greater side) - (lesser side) of an equation. Useful for setting equal to zero to test or plot, with f(x,y)>0
# Creates a function by subtracting the lesser side
# of the inequality from the greater side.
function(`f`): parseInequality(input.latex).differenceFunction(`x`,`y`)
​
# Creates a variable in the graph and sets it to 1 when the 
# inequality is strictly less than or greater than, and 0
# when the inequality is less than or equal to or greater than or 
# equal to.
number(`s_{trict}`): when parseInequality(input.latex).isStrict 1 otherwise 0

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:list

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
list
Represents a list of items.
Attributes:
length
Takes a List and returns its length as a number.
# Create a list using the values in column 1 of the table.
​
X = table.columnNumericValues(1)
​
# Use CL to display a dynamic note.
​
content:
# When the table is empty (list length = 0),
# tell the student to enter some x values.
when length(X) = 0 "Enter some values for `x`."
​
# After at least one point has been entered, display
# a new set of instructions is displayed along with
# the number of points entered, represented by length(X).
otherwise "You have entered `${length(X)}` points.
​
What do you think this graph will look like?
​
Use the sketch tool if it helps with your thinking."
elementAt
Takes a List and an index, and returns the element of the list at that index (starts with 1)
# Create variables for the distances from the center
# for each of the first 5 elements in the history list "distance"
​
d1 = button.history("distance").elementAt(1)
d2 = button.history("distance").elementAt(2)
d3 = button.history("distance").elementAt(3)
d4 = button.history("distance").elementAt(4)
d5 = button.history("distance").elementAt(5)
​
# Set the cellContent for each row using the variables d1-5
# Conditionally set the nth cell to blank before the nth attempt
​
cellContent(1,2): when button.pressCount < 1 "" otherwise "${d1}" 
cellContent(2,2): when button.pressCount < 2 "" otherwise "${d2}" 
cellContent(3,2): when button.pressCount < 3 "" otherwise "${d3}" 
cellContent(4,2): when button.pressCount < 4 "" otherwise "${d4}" 
cellContent(5,2): when button.pressCount < 5 "" otherwise "${d5}" 
​
# Display the most recent element of the history list on row 6.
# note: in this case it could also be attained using lastValue, 
# but elementAt is used here to showcase a dynamic index.
​
cellContent(6,2): when button.pressCount < 6 "" otherwise "${button.history("distance").elementAt(button.pressCount)}"

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:mathFunction

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
mathFunction
Represents a mathematical function that can be evaluated.
Creating:
simpleFunction
Takes a latex string and returns a function which can, for example, be passed into the function sink of a calculator The first argument is the latex string, and additional arguments are The names of the variables to treat as input variables (defaults to one-variable function in terms of x if not specified
# Get the latex string from "equationInput" and assign
# it to f in the calculator.
​
function("f"): simpleFunction(equationInput.latex, "x")
Attributes:
evaluateAt
evaluate function with given arguments
# Create some simpleFunctions. we'll use them to help find
# our missing values
hypLength = simpleFunction("\sqrt{a^{2}+b^{2}}","a","b")
legLength = simpleFunction("\sqrt{c^{2}-a^{2}}","a","c")
# Set the content of cells (1,3) and (2,2)
cellContent(1,3):
​
# If either of the two inputs are undefined, don't show anything.
  when isUndefined(this.cellNumericValue(1,1)) or isUndefined(this.cellNumericValue(1,2)) ""
​
# Create a simpleFunction that sums the squares of the two legs
# and takes the square root. Define those two variables "a" and "b"
# evaluate the function at the two editable cells. The output is a number.
  otherwise "${hypLength.evaluateAt(this.cellNumericValue(1,1),this.cellNumericValue(1,2))}"
​
cellContent(2,2):
# If either of the two inputs are undefined, don't show anything.
  when isUndefined(this.cellNumericValue(2,1)) or isUndefined(this.cellNumericValue(2,3)) ""
​
# Create a simplefunction that subtracts the squares of a leg and the
# hypotenuse and takes the square root. Define those two variables "a" and "c"
# evaluate the function at the two editable cells. The output is a number.
  otherwise "${legLength.evaluateAt(this.cellNumericValue(2,1),this.cellNumericValue(2,3))}"

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:orderedPair

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
orderedPair
Represents an ordered pair.
Creating:
parseOrderedPair
Takes a latex string - e.g. "(a,2)" - and returns a coordinate pair - e.g. x: "a", y: "2".
# Get the latex string from the expression input component
# "orderedPairInput". Create an orderedPair object using
# parseOrderedPair and then assign that object to the
# Computation Layer variable "myPair".
myPair = parseOrderedPair(orderedPairInput.latex)
​
# Assign the numeric value of the x property
# of the orderedPair object named "myPair" to
# the calculator variable "x_last".
number("x_{last}"): numericValue(myPair.x)
​
# Assign the numeric value of the y property
# of the orderedPair object named "myPair" to
# the calculator variable "y_last".
number("y_{last}"): numericValue(myPair.y)
Attributes:
x
Latex string for first element of pair
# Get the latex string from the expression input component
# "orderedPairInput". Create an orderedPair object using
# parseOrderedPair and then assign that object to the
# Computation Layer variable "myPair".
myPair = parseOrderedPair(orderedPairInput.latex)
​
# Assign the numeric value of the x property
# of the orderedPair object named "myPair" to
# the calculator variable "x_last".
number("x_{last}"): numericValue(myPair.x)
​
# Assign the numeric value of the y property
# of the orderedPair object named "myPair" to
# the calculator variable "y_last".
number("y_{last}"): numericValue(myPair.y)
y
Latex string for second element of pair
# Get the latex string from the expression input component
# "orderedPairInput". Create an orderedPair object using
# parseOrderedPair and then assign that object to the
# Computation Layer variable "myPair".
myPair = parseOrderedPair(orderedPairInput.latex)
​
# Assign the numeric value of the x property
# of the orderedPair object named "myPair" to
# the calculator variable "x_last".
number("x_{last}"): numericValue(myPair.x)
​
# Assign the numeric value of the y property
# of the orderedPair object named "myPair" to
# the calculator variable "y_last".
number("y_{last}"): numericValue(myPair.y)

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:randomGenerator

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
randomGenerator
Contains random number generators.
Creating:
randomGenerator
Create a random number generator. Provide zero or more numeric arguments as seeds (e.g. button.pressCount) if you want the numbers from this generator to re-randomize when those seed values change. See further documentation below.
# Instantiate the randomGenerator. Assign it to a variable.
# Also pass a "seed" as a parameter so that it generates new
# random numbers as the seed changes. (In this case the number
# of times the pointGetter button was pressed.)
r = randomGenerator(intGetter.pressCount)
​
# Get a random integer between -9 and 9 and assign
# it to "a" in the calculator component. Get another
# integer and assign it to "b".
number("a"): r.int(-9,9)
number("b"): r.int(-9,9)
Attributes:
int
Member function of a random number generator. Takes a and b as inputs arguments, and generates an output integer between round(a) and round(b) inclusive. |a| and |b| must both be less than 2^31, or the value will return NaN. That restriction may be relaxed in the future.
# Instantiate the randomGenerator. Assign it to a variable.
# Also pass a "seed" as a parameter so that it generates new
# random numbers as the seed changes. (In this case the number
# of times the pointGetter button was pressed.)
r = randomGenerator(intGetter.pressCount)
​
# Get a random integer between -9 and 9 and assign
# it to "a" in the calculator component. Get another
# integer and assign it to "b".
number("a"): r.int(-9,9)
number("b"): r.int(-9,9)
float
Member function of a random number generator. Takes a and b as inputs arguments, and generates an output float between a and b
# Instantiate the randomGenerator. Assign it to a variable.
# Also pass a "seed" as a parameter so that it generates new
# random numbers as the seed changes. (In this case the number
# of times the pointGetter button was pressed.)
r = randomGenerator(floatGetter.pressCount)
​
# Get a random real number between -10 and 10 and assign
# it to "a" in the calculator component. Get another
# real number and assign it to "b".
number("a"): r.float(-9,9)
number("b"): r.float(-9,9)

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:sketch

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
sketch
Represents the data for a sketch.
Attributes:
filterByColor
Filter a sketch to only the strokes and points that match the given color. Note that opacity does not affect this filtering.
# This code filters out only the purple sketches in 
# the sketch component to the left. 
Purple = sketch1.sketch.filterByColor(colors.purple)
​
# For display purposes, a background layer is created
# using only the purple sketches taken from the sketch
# component.
background: sketchLayer(Purple)
​
​
setColor
flatten all strokes and points in this sketch to the provided color
# This code copies the sketch created in 
# the sketch component but changes it's 
# color to black.
background: sketchLayer(sketch1.sketch.setColor(colors.black))
​
​
setOpacity
Change opacity of all strokes and points in the sketch to the provided alpha value. 0 is transparent, 1 is full opacity. Note that using `setColor` after `setOpacity` will override the provided alpha value
# This code copies the sketch created in 
# the sketch component but changes it's 
# opacity to 40%.
background: sketchLayer(sketch1.sketch.setOpacity(0.4))
​
​
scaleThicknessBy
scale the stroke thickness and point size by the provided amount, to a minimum of 1px for strokes and 2px for points.
# Create a background sketch layer using the student's sketch.
# Scale the thickness based on the graph slider/variable value (this graph)
# (it goes from 0 to 2).
​
background: sketchLayer(sketch1.sketch.scaleThicknessBy(this.number(`a`)))
pointCount
Takes a sketch and returns the number of points as a number.
# Sets the screen's subtitle to display the number of points
# plotted in the sketch component.
subtitle: "You have plotted `${sketch1.sketch.pointCount}` points."
textCount
Takes a sketch and returns the number of text items as a number.
# This counts how many text or math input boxes 
# someone creates in the sketch component.
​
number = sampleSketch.sketch.textCount
strokeCount
Takes a sketch and returns the number of strokes as a number.
# Merges the current sketch and the existing sketch into
# a single sketch layer.
totalSketch = mergeSketches(this.sketch,this.currentStroke)
​
# Resets the sketch when the total number of strokes is 
# greater than one.
resetOnChange: when totalSketch.strokeCount < 2 "0" otherwise "1"
totalStrokeLength
Takes a sketch and returns a number the aggregate length of all strokes as a number.
# Create a subtitle that displays the total length of all
# of the strokes in the sketch.
subtitle: "Total length: `${sketch1.sketch.totalStrokeLength}`"
yValuesAt
Returns a numberList of all y-values that the sketch passes through at a given x value
# Create number lists for the y values of the
# sketch at x= -8, -4, 0, 4, and 8.
numberList("Y_{n8}"): this.sketch.yValuesAt(-8)
numberList("Y_{n4}"): this.sketch.yValuesAt(-4)
numberList("Y_{0}" ): this.sketch.yValuesAt(0)
numberList("Y_{4}" ): this.sketch.yValuesAt(4)
numberList("Y_{8}" ): this.sketch.yValuesAt(8)
xValuesAt
Returns a numberList of all x-values that the sketch passes through at a given y value
# Create number lists for the x values of the
# sketch at y= -8, -4, 0, 4, and 8.
numberList("X_{n8}"): this.sketch.xValuesAt(-8)
numberList("X_{n4}"): this.sketch.xValuesAt(-4)
numberList("X_{0}" ): this.sketch.xValuesAt(0)
numberList("X_{4}" ): this.sketch.xValuesAt(4)
numberList("X_{8}" ): this.sketch.xValuesAt(8)
pointXValues
Returns the x coordinates of points in the sketch as a list
# Create two number lists X and Y, that track the 
# x and y locations, respectively of all the points
# plotted in this component.
numberList("X"): this.sketch.pointXValues
numberList("Y"): this.sketch.pointYValues 
pointYValues
Returns the y coordinates of points in the sketch as a list
# Create two number lists X and Y, that track the 
# x and y locations, respectively of all the points
# plotted in this component.
numberList("X"): this.sketch.pointXValues
numberList("Y"): this.sketch.pointYValues 
transform
Apply an arbitrary transformation to a sketch, by specifying functions
# Combine the current sketch and the existing sketch
# strokes into a single layer that can be transformed.
totalSketch = mergeSketches(this.currentStroke, this.sketch)
​
# Use simpleFunction to create simpleFunctions to transform
# x and y, respectively
​
xTransform = simpleFunction("1.5x","x","y")
yTransform = simpleFunction("1.5y","x","y")
​
# Put everything together and display the transformed function as a background
# Create a sketchLayer by transforming totalSketch using xTransform and yTransform.
​
background: sketchLayer(totalSketch.transform(xTransform,yTransform))

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:xyLine

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
annotationKeyPair
bounds
buttonStyles
color
colorPalette
conic
equation
evaluationFrame
inequality
list
location
mathFunction
orderedPair
parabola
polypadTools
randomGenerator
sketch
sketchTools
xyLine
Other Functions
Deprecated Functions
xyLine
Represents a linear equation or expression.
Creating:
xyLine
Create a new xyLine object from the provided latex string.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays the slope of the xyLine object in a table.
cellContent(2,2): "${myLine.slope}"
​
# Displays the y-intercept of the xyLine object in a table.
cellContent(3,2): "${myLine.yIntercept}"
​
# Displays the x-intercept of the xyLine object in a table.
cellContent(4,2): "${myLine.xIntercept}"
​
# Displays "Yes" if the line is horizontal.
cellContent(5,2): "${when myLine.isHorizontal "Yes" otherwise "No"}"
​
# Displays "Yes" if the line is vertical.
cellContent(6,2): "${when myLine.isVertical "Yes" otherwise "No"}"
​
# Displays the angle the line makes with the x-axis in radians.
cellContent(7,2): "${myLine.angle}"
Attributes:
angle
Returns the angle an xyLine object makes with the x-axis, measured in radians.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays the angle the line makes with the x-axis in radians.
cellContent(2,2): "${myLine.angle}"
slope
Returns the slope of an xyLine object.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays the slope of the xyLine object in a table.
cellContent(2,2): "${myLine.slope}"
​
yIntercept
Returns the y-intercept of an xyLine object.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays the y-intercept of the xyLine object in a table.
cellContent(2,2): "${myLine.yIntercept}"
​
xIntercept
Returns the x-intercept of an xyLine object.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays the x-intercept of the xyLine object in a table.
cellContent(2,2): "${myLine.xIntercept}"
​
isHorizontal
Returns a Boolean value given an xyLine object that indicates whether or not the line is horizontal.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays "Yes" if the line is horizontal.
cellContent(2,2): "${when myLine.isHorizontal "Yes" otherwise "No"}"
​
isVertical
Returns a Boolean value given an xyLine object that indicates whether or not the line is vertical.
# Assigns to a variable called "myLine" an "xyLine" object
# built from the content of a cell in the table.
myLine = xyLine(lineInfoTable.cellContent(1,2))
​
# Displays "Yes" if the line is vertical.
cellContent(2,2): "${when myLine.isVertical "Yes" otherwise "No"}"
​

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#other-functions

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
Other Functions
Deprecated Functions
Other Functions
Here are some functions which don't fit cleanly into one of the above sections.
mergeSketches
Create a sketch from other sketches.
# Combines the current stroke with the rest of
# the sketch to create a layer that appears in 
# real time.
background: sketchLayer(mergeSketches(sketch1.sketch,sketch1.currentStroke))
length
Takes a List and returns its length as a number.
# Create a list using the values in column 1 of the table.
​
X = table.columnNumericValues(1)
​
# Use CL to display a dynamic note.
​
content:
# When the table is empty (list length = 0),
# tell the student to enter some x values.
when length(X) = 0 "Enter some values for `x`."
​
# After at least one point has been entered, display
# a new set of instructions is displayed along with
# the number of points entered, represented by length(X).
otherwise "You have entered `${length(X)}` points.
​
What do you think this graph will look like?
​
Use the sketch tool if it helps with your thinking."
numericValue
Takes a latex string, and evaluates it to a number, if possible. Returns NaN if it fails
# Get the latex string from the expression input component
# "orderedPairInput". Create an orderedPair object using
# parseOrderedPair and then assign that object to the
# Computation Layer variable "myPair".
myPair = parseOrderedPair(orderedPairInput.latex)
​
# Assign the numeric value of the x property
# of the orderedPair object named "myPair" to
# the calculator variable "x_last".
number("x_{last}"): numericValue(myPair.x)
​
# Assign the numeric value of the y property
# of the orderedPair object named "myPair" to
# the calculator variable "y_last".
number("y_{last}"): numericValue(myPair.y)
conic
Create a new conic object from the provided latex string.
No code sample available
evaluationFrame
Creates a frame to store functions and variables for future evaluation.
# Open an evaluation frame.
frame = evaluationFrame()
# Define the variables a and b and assign their values 
# using the cell valuees from table1.
  .define(`a`,table1.cellNumericValue(1,1))
  .define(`b`,table1.cellNumericValue(1,2))
# Define the functions f and g and create them using
# the cell content from table2.
  .define(`f`,simpleFunction(table2.cellContent(1,1)))
  .define(`g`,simpleFunction(table2.cellContent(1,2)))
  
  
# Evaluate the function and variables from the tables
# acording to the math input.
output = input1.script.frame.evaluate(this.latex)
substituteLatexVariable
Takes a latex string, a search string, and a replace string - and returns the latex having made the substitution.
# Substitute in the student input for a and b.
subA = substituteLatexVariable(input1.latex,"a",table1.cellContent(1,1))
subB = substituteLatexVariable(subA,"b",table1.cellContent(1,2))
​
# Display the evaluation only after input1 is submitted
eval = when input1.submitted "`${subB}=${input1.script.output}`" otherwise "Press \"Submit\" to see the evaluation."
countNumberUsage
Counts numeric constants in a latex string. countNumberUsage(latex) counts all numbers, or if you provide a specific number as an argument, only that number specifically will be counted
# Create a dynamic note that displays the
# total amount of 4's and numbers altogether
# in the math input
​
content:
"Use the number \"`4`\" four times to create an expression that equals `4`.
​
Total numbers: `${countNumberUsage(input.latex)}`
​
Total `4`'s: `${countNumberUsage(input.latex,4)}`
​
Equal to `4`? ${when input.numericValue = 4 "Yes" otherwise "No"}"
formatLatex
Takes latex equations and expressions and applies a small set of simplification rules to format the equations and expressions nicely.
No code sample available
sketchLayer
Create a layer from a sketch.
# Creates a sketch layer using only what's currently
# being sketched. and displays it in the background.
background: sketchLayer(sketch1.currentStroke)
layerStack
Create a stack of layers from other layers.
# Creates a sketch layer using only what's currently
# being sketched and a separate sketch layer out of
# the existing sketch.
# Stacks these layers together and displays them in
# graph background.
background: layerStack(sketchLayer(sketch1.sketch),sketchLayer(sketch1.currentStroke))
graphLayer
Create a layer from a graph. Use it like graphLayer(g.calculatorState)
No code sample available

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#deprecated-functions

Computation Layer Documentation
Join the discussion!
Welcome
Getting Started
Components
Advanced
Index
Logic and Conditionals
Types
Other Functions
Deprecated Functions
Deprecated Functions
These functions have all been deprecated. If it's on this list, we now have a better way to do the same thing, which we recommend using instead.
sketchStrokeCount
Takes a sketch and returns the number of strokes as a number.
deprecatedPlease use sketch.strokeCount instead.
sketchPointCount
Takes a sketch and returns the number of points as a number.
deprecatedPlease use sketch.pointCount instead.
sketchTotalStrokeLength
Takes a sketch and returns a number the aggregate length of all strokes as a number.
deprecatedPlease use sketch.totalStrokeLength instead.
sketchYValues
Returns a numberList of all y-values that the sketch passes through at a given x value
deprecatedPlease use sketch.yValuesAt instead.
sketchXValues
Returns a numberList of all x-values that the sketch passes through at a given y value
deprecatedPlease use sketch.xValuesAt instead.
angleOfLine
Returns the angle an xyLine object makes with the x-axis, measured in radians.
deprecatedPlease use line.angle instead.
slopeOfLine
Returns the slope of an xyLine object.
deprecatedPlease use line.slope instead.
yInterceptOfLine
Returns the y-intercept of an xyLine object.
deprecatedPlease use line.yIntercept instead.
xInterceptOfLine
Returns the x-intercept of an xyLine object.
deprecatedPlease use line.xIntercept instead.
isLineHorizontal
Returns a Boolean value given an xyLine object that indicates whether or not the line is horizontal.
deprecatedPlease use line.isHorizontal instead.
isLineVertical
Returns a Boolean value given an xyLine object that indicates whether or not the line is vertical.
deprecatedPlease use line.isVertical instead.
stretch
Bounds strategy stretch. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
left
Bounds strategy left. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
right
Bounds strategy right. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
centeredHorizontal
Bounds strategy centeredHorizontal. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
bottom
Bounds strategy bottom. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
top
Bounds strategy top. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.
centeredVertical
Bounds strategy centeredVertical. Use this in conjunction with bounds.setStrategy (deprecated).
deprecatedPlease use bounds.METHODNAME instead.

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#component:polygraph

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#advanced

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:annotationKeyPair

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:buttonStyles

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:color

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:location

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:polypadTools

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Scraped from: https://classroom.amplify.com/computation-layer/documentation#type:sketchTools

var init;

      function checkState(clientId, origin, sessionState, callback) {
        var cookie = getCookie();

        var checkCookie = function () {
          if (clientId === init.clientId && origin === init.origin) {
            var c = cookie.split("/");
            if (sessionState === c[2]) {
              callback("unchanged");
            } else {
              callback("changed");
            }
          } else {
            callback("error");
          }
        };

        if (!init) {
          var req = new XMLHttpRequest();

          var url = location.href.split("?")[0] + "/init";
          url += "?client_id=" + encodeURIComponent(clientId);
          url += "&origin=" + encodeURIComponent(origin);

          req.open("GET", url, true);

          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 204 || req.status === 1223) {
                init = {
                  clientId: clientId,
                  origin: origin,
                };
                if (!cookie) {
                  if (sessionState != "") {
                    callback("changed");
                  } else {
                    callback("unchanged");
                  }
                } else {
                  checkCookie();
                }
              } else {
                callback("error");
              }
            }
          };

          req.send();
        } else if (!cookie) {
          if (sessionState != "") {
            callback("changed");
          } else {
            callback("unchanged");
          }
        } else {
          checkCookie();
        }
      }

      function getCookie() {
        var cookie = getCookieByName("KEYCLOAK_SESSION");
        if (cookie === null) {
          return getCookieByName("KEYCLOAK_SESSION_LEGACY");
        }
        return cookie;
      }

      function getCookieByName(name) {
        name = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
          var c = ca[i].trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      }

      function receiveMessage(event) {
        if (typeof event.data !== "string") {
          return;
        }

        var origin = event.origin;
        var data = event.data.split(" ");
        if (data.length != 2) {
          return;
        }

        var clientId = data[0];
        var sessionState = data[1];

        function doStateCheck() {
          checkState(clientId, event.origin, sessionState, function (result) {
            event.source.postMessage(result, origin);
          });
        }
        // [Start] AMPLIFY CUSTOM CODE: v19 Upgrade - Don't rely on local storage
        doStateCheck()
        // [End] AMPLIFY CUSTOM CODE
      }

      window.addEventListener("message", receiveMessage, false);

---

## Forum docs & tips (scraped)

Content below scraped from the [Computation Layer Support Forum](https://cl.desmos.com/).

### Computation Layer 101 - Articles

Source: https://cl.desmos.com/t/computation-layer-101/8414


Computation Layer 101


JayChow

(Jay Chow)

November 25, 2025, 11:35pm

1

This article contains interactive elements. make sure you are signed into  Activity Builder  before continuing.

Note: This article is a companion piece to our Introduction to CL webinar. You can view and register for upcoming webinars by visiting our  PD page .

Do I Need CL?

Lets start with something simple: On screen 1 we’ll tell the students we’re thinking of a number between 1 and 10. On screen 2 we’ll share our number with the class and see who’s closest.

This activity fails spectacularly for three reasons:

There’s a heavy reliance on the teacher to set up and execute pacing in order to keep the number secret.

Once students are paced to the answer screen they no longer have access to their guess.

This activity can and has been done for decades in a fraction of the time using a paper, clipboard, etc.

Digging into the third reason, you want your activities to be worth the time it takes to create, refine, and deliver using Activity Builder. This doesn’t always require the use of CL (think graph explorations, marbleslides, and basic challenge creators), but often do. In this article we’ll use our simple  Guess My Number  activity as an example to show you how to use CL to add interactivity to your Activity Builder creations.

The first thing we want to do is condense this interaction down to a single screen. For obvious reasons, simply combining the components won’t work:

In order to hide the solution we’ll need to add our first line of CL, but first…

Your Big Override Button

In the past we’ve described CL as connective tissue between components, power lines, or a series of “getters” and “setters”. Here, we’ll introduce what CL actually does, which is in essence overriding anything you set during authoring.

Don’t like what your note says? Override it!

Variable in a graph set incorrectly? Change it!

Don’t like the tool a student starts with  or the initial color of a sketch? Make it what you want!

The CL Documentation has a long list of things we can override in a component. We call these overrides   sinks  .

For example. I can tell a note component to override it’s content using the content sink:

content: "Hello World"

Or I can use a number sink in a graph to change the value of a variable:

number(`A`): 5

I can even make a component hide itself completely:

hidden: true

We’ll use this method for part 1 of our upgrade.

Override? With What?

You can hard code your CL by telling it exactly what you want the override to be.

“add a string of text”

Set it to a number, e.g. 5

However, most times you’ll want to apply something from another component as the override of placeholder text or values. In these cases you’ll need to know:

Where the information is coming from.

What information you want to use.

This brings us to our first tip:

Tip    #1:    Give names to your components and develop your own conventions for naming them.

Naming components beforehand, especially components that contain information you’ll want to use later saves you the trouble of having to break your train of thought to exit a scripting window to name a component later.

With your component named, you now have a pathway to gather the information you want to use for your override.

Let’s use this tip and apply it on screen 2 so that students can compare their answer with the correct one:

Example: Overriding Note Content

Before we begin, lets make sure we’ve named the math input on screen 1.

image  854×201 11.5 KB

I’m going to make a note component with that prompts the response, and below it, add a note component to bring in the student’s response. We can add some placeholder text here, remember that we’ll be overriding it with CL

image  506×374 13.4 KB

lets override the content of this note:

For the content of the note, I want to look inside our input and extract the latex:

We’ve completed our first override! Test it out:

Tip  #2:  Use the CL Documentation Reference

Curious about what else you can override in a component or what you can use in a component to override something in another component? Use the handy reference found in every CL scripting window. Try overriding a few other things yourself. Here are a few examples you can start with:

Change the screen title

Add a subtitle

Edit the submit button of an input

Add some placeholder text to the input

The two screen layout still feels like too much for such a simple screen. An improvement would be to condense it down to a single screen.

Example: Conditional Statements

We can write a simple override on screen 1 to replace the prompt with the correct answer. But after previewing, you’ll see that we haven’t specified when to display the answer, which is a problem:

To fix this, we’ll need to write some conditional statements. These statements say  when  to override to something you want and what to set it to  otherwise . You can read more about conditional statements  here .

I know that when the input is submitted I want to show the correct answer:

Otherwise, I want to display the prompt:

This works very similarly to “if” and “else” statements in other programming languages. You can list as many “when” statements (conditions to meet) as you want that must be followed by a single “otherwise” (default) statement.

Finally, I want to make sure a student doesn’t submit a response, see the answer, and then change their response. In order to do that, let’s disable the input after a student has submitted one response.

Example: Disabling The Math Input

I want to override whether or not a student can submit a response so I start by going into the input component and searching for a sink that will allow me to override that setting:

Screenshot 2026-01-06 at 7.45.48 AM  367×576 36.3 KB

Then I write come conditions that extract the number of times the input has been submitted and set appropriate true and false conditions to enable and disable the editability of the input:

Fun Fact: We can change two things to simplify our code here.

Tip   #3:  Use “this”

When you’re using information from the same component that you are attempting the override in, “this” can be used in place of the component name:

Useful in case the name of your component changes later!

Tip  #4:  Boolean Shortcut

Boolean (true/false) sinks don’t always require conditional statements! In many cases, listing just the condition you want to set the sink to “true” will do the trick:

Your Finished Interaction:

Next Steps

You’ve completed your interaction, but don’t stop improving! Pick one or a few of these add-ons to really make your interaction dynamic:

Tell Students "Higher" or Lower"

For this we're going to make a change to the conditional statements in the note component.

1. We'll set an initial condition to display the prompt whenever the math input is not submitted.

2. Then, we'll generate a "Too low!" message whenever an answer of less than your target is entered.

3. We'll do the same for answers that are too high.

4. Finally, we'll set our default statement to say "Correct!" if none of the previous statements are true.

Add a Guess Counter

Note: For this add-on, use the "Higher or Lower" add-on or similar.

1. Add a new note component to your screen

2. Use CL to override the content of the note to say "Number of guesses:"

3. We want to *interpolate* the number of guesses into this string. to do this, add ${ } at the end of your string.

4. Fill it with the submission count from the math input:

Add a Target Graph

1. Add a new graph component to your screen

2. Paste this link into the expression list:  https://www.desmos.com/calculator/e0ae70ed74

3. Override the  g_{uess}  and  t_{ime}  values in the graph using CL

Use Any Number

1. Start by completing the "Add a Target Graph" add-on.

2. Use CL to override the bounds of the graph. Take a look at the  bounds  sink and  makeBounds  function to learn more.

3. In the graph, change the  t_{arget}  and  t_{olerance}  variables to adjust the target and the size of the onscreen window.

Start A Timer

1. Add a new graph component

2. Copy and paste the URL of this graph into the expression list  https://www.desmos.com/calculator/gdxlpqtokn

3. use CL to override the  g_{uess} ,  t_{ime} , and  p_{ressCount}  variables.

Add a Contextual Animation

1. Add a new graph component

2. Copy and paste the URL of this graph into the expression list  https://www.desmos.com/calculator/txleelehjs

3. use CL to override the  g_{uess}  and  t_{ime}  variables.

Advanced: Tell students if They're Getting "Warmer" or "Colder"

We're going to rewrite our conditional statements in the note, but first we need to set a few things up:

1. Go into the input component and create a  capture . Give it a name.

2. In the math input we're going to create a variable. Variables use an "=" instead of a ":". Call this variable "previous".

5. For this variable, I want to recall not the most recent captured value, but the one before it. We can do this by looking up the capture history and extracting the captured value  before  the most recent captured value:

6. Lets make another variable for "last". this one is a bit simpler, pulling the  lastValue  from the capture history.

7. Now, lets write a function that calculates the difference between your target and another value:

8. Finally, we can rewrite our note conditions to display "Getting warmer!" when the  last  value is less than the  previous  value and "Colder!" when the  last  value is greater than the  previous  value.

9. You'll also need to add a condition that says something else when stthe two values are equal, but I'll leave that up to you.

1 Like

Related topics

Topic

Replies

Views

Activity

CL Newsletter, March 2021 - Our Favorites

CL Newsletter Archive

community

0

148

March 28, 2024

Could Someone Give me with Creating Custom Interactive Desmos Activity Using Computation Layer?

Questions

1

220

September 25, 2024

CL Newsletter, February 2020 - Do More With Less!

CL Newsletter Archive

introduction

,

suffix

,

student-input

,

interpolation

0

182

March 25, 2024

CL Specialist Training

Discussion

2

744

May 30, 2024

CL Newsletter, January 2020 - Ordering Conditional Statements

CL Newsletter Archive

introduction

,

conditional-statements

0

119

March 25, 2024


### Show/Hide a Component - Examples

Source: https://cl.desmos.com/t/show-hide-a-component/2028


Show/Hide a Component


mrkleing

(Gregg Klein)

November 25, 2020, 10:51pm

1

I thought this was a useful technique to share. Show/hide a component with one button.

In the button CL:

label:

when numericValue("(-1)^{${this.pressCount}}") = 1 “Show”

otherwise “Hide”

In the component you want to show/hide:

hidden: numericValue("(-1)^{${showHide.pressCount}}")=(1)

make sure to name your button showHide

this starts off with component hidden and will show it. If you want to start with it shown and then hide it, use the following:

In the button CL:

label:

when numericValue("(-1)^{${this.pressCount}}") = 1 “Hide”

otherwise “Show”

In the component you want to show/hide:

hidden: numericValue("(-1)^{${showHide.pressCount}}")=(-1)

4 Likes

SqrtOfPi

(Debbie Gaydos)

November 26, 2020, 12:10am

2

Nice! I use mod to toggle stuff like this:

p=hint1.pressCount

hidden: numericValue("\mod(${p},2)")=0

The other nice thing with mod is you can have more than a binary on/off toggle. I have some activities were I might have something “toggle” mod 4 or 5 or whatever, to cycle through several states and then start over.

2 Likes

mrkleing

(Gregg Klein)

November 26, 2020,  1:08am

3

awesome I have never used mod before, please explain

Daniel_Grubbs

November 26, 2020,  4:14am

4

It’s basically a division and the output is the remainder. So, anything mod 2, even numbers output 0, odd output 1.

3 Likes

mrkleing

(Gregg Klein)

November 26, 2020,  4:41am

5

negatives work the same?

SqrtOfPi

(Debbie Gaydos)

November 26, 2020,  3:21pm

6

Negatives work in the mod function. You can play around with the mod function in the graphing calculator to get a feel for how it works:

Desmos

Desmos | Graphing Calculator

1 Like

mrkleing

(Gregg Klein)

November 26, 2020,  3:23pm

7

got it thanks. I just created a self checking for myself to figure it out

1 Like

Related topics

Topic

Replies

Views

Activity

Action Button Toggles On and Off

Questions

7

5055

March 9, 2021

Making a button show/hide a graph

Questions

1

2023

September 10, 2020

Hide and show on basic desmos

Questions

1

457

March 1, 2024

Action Button reveals graph?

Questions

11

10858

September 10, 2020

Conditionally hiding components

Questions

4

116

July 7, 2025


### List Functions in CL - Articles

Source: https://cl.desmos.com/t/list-functions-in-cl/7353


List Functions in CL


SchuylerAlschuler

(Schuyler Alschuler)

October 2, 2024,  9:44pm

1

Until recently, CL has had limited support for lists. Using the graph’s  numberList  source, you could access elements of a list or pass them between graphs, but not much else. In this article, we’ll give you a preview of some upcoming features that make lists much more flexible.

These features aren’t complete and there may be breaking changes. They won’t enter the official documentation for some time. Nonetheless, if you’ve been wanting to do more with lists, read on!

Creating and accessing lists

If you want to make a list, you can use use brackets. For example, to make a list of five numbers you might enter:

myNumbers = [5, 3.14, 2.71, 19, -3]

After making a list, you can access its elements using the  elementAt  function or brackets. In our example,  myNumbers.elementAt(1)  and  myNumbers[1]  would both be equal to  5 .

One very exciting change is that you can now have lists of almost any type! A list of strings might look like:

myStrings = ["Hello", "world."]

# This would be the string "Hello world."

myNewString = "${myStrings[1]} ${myStrings[2]}"

List functions

Just being able to define lists in CL unlocks a world of possibility, but there are also many new and powerful functions for working with them. In this article, we’ll provide an overview of those functions. Be on the lookout for more detailed examples in future articles!

Arrow functions

Many list functions use syntax that is new to CL to define  arrow functions . Arrow functions look like  (parameters) => expression . The left side takes a comma separated list of parameters. The right side is an expression that defines the output of the function.

Arrow functions are similar to the mathematical functions you might be used to, but they can act on values of any type.

Jump to the details for any of these functions:

map

filter

first

all and any

range

slice

join

reverse

reduce

Lists.map()

The  map()  function creates a new list in which each element is the result of calling the provided arrow function on every element of the calling list.

expression that does something with each element in a list)">  expression that does something with each element in a list)" data-base62-sha1="4ASwR9DuWjJuXjIcbomiafHlE9J" width="517" height="162" srcset="https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/2/2033ed0d23dd549078a83aa87c5986309643d9a3_2_517x162.png, https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/2/2033ed0d23dd549078a83aa87c5986309643d9a3_2_775x243.png 1.5x, https://canada1.discourse-cdn.com/flex031/uploads/desmos/original/2X/2/2033ed0d23dd549078a83aa87c5986309643d9a3.png 2x" data-dominant-color="EEEEEE">      Map syntax. .map((current list element, current index) => expression that does something with each element in a list)  900×282 21.6 KB

Variations of map

The current element and index arguments can be omitted.  900×213 12.7 KB

Example

# This would return the list [false, false, false, true, true].

myList = [1, 2, 3, 4, 5].map((el) => el > 3)

Lists.filter()

The  filter()  function returns a copy of the calling list containing only the elements that return true for the given test function.

expression that evaluates to a boolean))">  expression that evaluates to a boolean))" data-base62-sha1="1W58p599DveiedZ9K5eV6UXXF2f" width="517" height="162" srcset="https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/0/0d92fde575edf3778e5436567e2a9ffa9d4b1507_2_517x162.png, https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/0/0d92fde575edf3778e5436567e2a9ffa9d4b1507_2_775x243.png 1.5x, https://canada1.discourse-cdn.com/flex031/uploads/desmos/original/2X/0/0d92fde575edf3778e5436567e2a9ffa9d4b1507.png 2x" data-dominant-color="EEEEEE">      Filter syntax. .filter((current list element, current index) => expression that evaluates to a boolean))  900×282 21.3 KB

Variations of filter

The index argument can be omitted.  900×213 9.5 KB

Example

# This would return the list [4, 5].

myList = [1, 2, 3, 4, 5].filter((el) => el > 3)

Lists.first()

The  first()  function returns the first element of a list that returns true for the given test function.

expression that evaluates to a boolean)">  expression that evaluates to a boolean)" data-base62-sha1="bVg39CSSgv6wLjkb705kFDLUIws" width="517" height="162" srcset="https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/5/5390e34be40a47fc8ad243d15bfde0a4c8e2ce1c_2_517x162.png, https://canada1.discourse-cdn.com/flex031/uploads/desmos/optimized/2X/5/5390e34be40a47fc8ad243d15bfde0a4c8e2ce1c_2_775x243.png 1.5x, https://canada1.discourse-cdn.com/flex031/uploads/desmos/original/2X/5/5390e34be40a47fc8ad243d15bfde0a4c8e2ce1c.png 2x" data-dominant-color="EEEEEE">      First syntax. .first(current list element, current index) => expression that evaluates to a boolean)  900×282 21.3 KB

Variations of first

The index argument can be omitted.  900×213 9.48 KB

Example

# This would return the number 4.

myList = [1, 2, 3, 4, 5].first((el) => el > 3)

Lists.all() and Lists.any()

The  all()  and  any()  functions are used to check if all (or any) elements of a list return true for a given test function.

expression that evaluates to a boolean)">  expression that evaluates to a boolean)" data-base62-sha1="oiqSrRX0IwKIGU1Ji5XrEV47cou" width="517" height="162" data-dominant-color="EBEBEB">      All and any syntax. .all or .any((current list element, index) => expression that evaluates to a boolean)  900×282 16.4 KB

Variations

The index argument can be omitted from all or any.  900×213 12.9 KB

Example

# anyPositive would be true.

anyPositive = [1, 2, -3, 2, -9].any((el) => el > 0)

# allPositive would be false.

allPositive = [1, 2, -3, 2, -9].all((el) => el > 0)

range

Create a list of numbers starting at a lower bound and ending at an upper bound. A step size can be added.

Range syntax. range(lower bound, upper bound, step size between list items)  900×282 14.4 KB

Variations of range

range(upper) creates a list from 1 to the upper bound. range(lower, upper) creates a list from lower to upper with a step size of 1.  900×213 12.2 KB

Example

# This would return the list [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].

list1 = range(10)

# This would return the list [5, 6, 7].

list2 = range(5, 7)

# This would return the list [0, 20, 40, 60, 80, 100].

list3 = range(0, 100, 20)

Lists.slice()

The  slice()  function returns a copy of a subset of the given list. It operates similarly to the graphing calculator statement: [1, 2, 3, 4, 5][3…5].

Slice syntax. .slice(starting index, ending index)  900×282 10.7 KB

Example

# This would return the list [2, 3, 4].

mySlice = [1, 2, 3, 4, 5].slice(2, 4)

Lists.join()

The  join()  function joins a list to the end of another list. The lists must be the same type.

Join syntax. .join(a second list to join to the end of your first list)  900×282 9.78 KB

Example

# This would return the list [1, 2, 3, 4].

myList = [1, 2].join([3, 4])

Lists.reverse()

The  reverse()  function reverses the order of elements in a list.

.reverse  900×282 6.85 KB

Example

# This would return the list [3, 2, 1].

myList = [1, 2, 3].reverse()

Lists.reduce()

The  reduce()  function is used to reduce a list of values down to one value.

Reduce syntax. .reduce(initial value of the accumulator, reducer function). The reducer function takes three arguments: the result of the last call to the reducer function, the current list element, and the current index.  900×282 24 KB

Variations of reduce

The index argument can be omitted.  900×213 10.3 KB

Example

# You can use reduce to find the the sum of a list of numbers.

# This would return the number 15.

totalNum = [1, 2, 3, 4, 5].reduce(

0, # The initial value for the accumulator

(accumulator, current) => numericValue(`${accumulator}+${current}`)

)

Keep in mind that these features are still under development and may change in the future. Now, go forth and make some cool things with lists!

6 Likes

Is it a glich or am I doing something wrong?

CL Documentation needs to be updated

Summary of the students score

Trying to simplify a valid code used in all rows of a long table

More efficient way in CL

Related topics

Topic

Replies

Views

Activity

simpleFunction and numberList

Questions

2

814

September 21, 2018

How do I write a list in CL?

Questions

2

417

October 31, 2022

Total Function in CL

Questions

2

596

May 21, 2018

Access List Elements in CL

Announcements

0

2287

March 4, 2020

Evaluating the min or max of a Number List in CL

Questions

3

1524

February 6, 2021


### numericValue vs simpleFunction - Articles

Source: https://cl.desmos.com/t/numericvalue-vs-simplefunction/5528


numericValue vs simpleFunction


computation

JayChow

(Jay Chow)

April 3, 2024, 11:06pm

1

Computing values in CL requires a bit more than entering simple arithmetic (e.g.  1+1  won’t get you anywhere). For computations in CL, we primarily use  numericValue  and  simpleFunction . Here’s what each does:

numericValue  takes a string and computes it’s numeric value

simpleFunction  creates a function using any number of variables that can be evaluated at different values

When do I use  numericValue  vs  simpleFunction ?

The difference in use between the two functions boils down to a few simple points. Here’s when to use each:

numericValue

The computation only needs to be done once.

You either know exactly what numbers are being computed, or if inputs are variables, you know all of the possible inputs.

simpleFunction

The computation is repeated several times.

The inputs are highly variable.

For simple or non repeated calculations,  numericValue  is much simpler to write:

numericValue(`1+2`)

simpleFunction(`x+y`,`x`,`y`).evaluateAt(1,2)

The more you repeat the calculation, especially with lengthly computations,  simpleFunction  becomes more and more useful:

fn = simpleFunction(`x^{2}+6x+9`,`x`)

evaluate1= fn.evaluatAt(1)

evaluate2= fn.evaluatAt(10)

evaluate3= fn.evaluatAt(100)

evaluate4= fn.evaluatAt(1000)

evaluate5= fn.evaluatAt(10000)

Additionally, numericValue can break mysteriously when given really big or really small numbers:

image  1408×586 16.6 KB

One more thing…

If you want to take it one step further, check out  evaluationFrame ! This function allows you to make changes or combine parts of a calculation in a different way without rewriting the whole thing.

Step 1: Add your functions

frame = evaluationFrame()

.define(`f`,simpleFunction(`x+1`,`x`))

.define(`g`,simpleFunction(`2x`,`x`))

.define(`h`,simpleFunction(`x^{2}`,`x`))

Step 2: evaluate your functions

Code

Function

Output

.evaluate(`f(g(h(3)`)

2(3)^{2}+1

19

.evaluate(`g(h(f(3)`)

2(3+1)^{2}

32

.evaluate(`h(g(f(3)`)

(2(3+1))^{2}

64

.evaluate(`f(h(g(3)`)

(2\cdot3)^{2}+1

37

1 Like

Related topics

Topic

Replies

Views

Activity

CL Newsletter, August 2021 - Computations in CL

CL Newsletter Archive

simplefunction

0

136

March 28, 2024

Using variables in CL calculations

Questions

8

1104

August 5, 2022

Can simpleFunction use predefined variables

Questions

11

109

October 30, 2025

Checking a Caculated Value

Questions

9

748

May 5, 2022

Arithmetic with variables

Questions

2

960

June 21, 2018


### About the Examples category - Examples

Source: https://cl.desmos.com/t/about-the-examples-category/123


About the Examples category


eric

(Eric)

July 9, 2018,  5:56pm

1

Interesting, useful, or unique examples of how to do things in CL.

Try to keep your examples simple enough that others will be able to understand them, and describe why someone might find it interesting, and how they could do something similar.

Related topics

Topic

Replies

Views

Activity

Introduction to CL

Discussion

1

658

August 24, 2018

New sinks for sketch

Announcements

29

9446

January 20, 2022

CL Documentation Support?

Questions

1

492

October 16, 2019

Documentation Request

Questions

2

646

April 26, 2020

Computation Layer Documentation & Examples?

Questions

1

2103

April 24, 2018


### CL Newsletter, January 2020 - Ordering Conditional Statements - CL Newsletter Archive

Source: https://cl.desmos.com/t/cl-newsletter-january-2020-ordering-conditional-statements/5439


CL Newsletter, January 2020 - Ordering Conditional Statements


CL Newsletter Archive

conditional-statements ,

introduction

JayChow

(Jay Chow)

March 25, 2024, 11:51pm

1

Welcome to the first edition of the Desmos Computation Layer Newsletter!  Every

month, we’ll spend some time updating you on the newest and grooviest features

released to CL, teach you something new, and give you a place to level up your CL skills.

Along the way, we’ll share a little bit about who we are and what we do at Desmos.

Let’s start by welcoming the newest member of the

Desmos Graph and CL team! The Desmos Computation

Layer team doubled its size this year with John Rowe

joining as a CL specialist. John's a math teacher from

South Australia, and he loves the way CL can help

teachers mould a lesson around the student so they

can ask more meaningful questions.

John burst onto the scene in March with an activity that has since been run nearly 5,000

times and was featured on a  YouTube video  with over 900,000 views. He’s practically a

celebrity! He brings to the team a wealth of CL know-how and an intangible knack for

creating really delightful interactions.

Screenshot 2024-03-25 at 1.22.03 PM.jpg  1762×1762 130 KB

For those new to CL, we thank you for taking that first step towards creating delightful

activities with Desmos. For the CL veterans who have signed up for this newsletter, we

hope to bring you something of value and an update on new features. To everyone, read,

enjoy, and participate in the learning!

- Team Desmos CL

Ordering Conditional Statements

In this section we'll share some tips and tricks to keep you CL-ing happily. If you're brand new to CL or

want a more comprehensive introduction, you can also tune in to our  webinar series!

A big reason why Computation Layer is so powerful is its ability to design interactions that

respond to the user input. It allows us to produce various outputs and control the

behaviour of a component based on conditions we set. It might come in handy, for

example, if you want to show an estimate that students make at the beginning of a lesson

on a later screen, or you can use it to disable an action button if students haven't entered

a response. We are able to do these things (and much more) using  conditional statements .

Conditional statements in Computation

Layer are programmed to check each

statement, beginning with the first and

stopping once it has found a true

statement. This prevents the possibility of

an input generating two outputs. The

otherwise statement catches anything

that is not true for any of the conditions.

Screenshot 2024-03-25 at 1.36.21 PM.jpg  1710×1288 68.9 KB

How can we use this to our advantage? First, we can reduce the number of things we

need to check on each line by remembering that in order to reach lines 2, 3, 4, etc., the

statement must have already been marked as false on the previous lines. Furthermore, the

order of the conditions can be changed to further simplify the code.

Try It Yourself

Want to learn more? Try  this activity  to experience how reordering conditions can

optimize and error proof your code.

Rearrange conditional

statements and verify the

results of your condition

order.

Screenshot 2024-03-25 at 1.41.07 PM.jpg  1834×850 90.9 KB

Help settle a dispute

between two friends.

Screenshot 2024-03-25 at 1.41.23 PM.jpg  1836×916 127 KB

Computation Layer 101

Related topics

Topic

Replies

Views

Activity

Could Someone Give me with Creating Custom Interactive Desmos Activity Using Computation Layer?

Questions

1

220

September 25, 2024

Using Conditionals to customize student questions (adaptive quizzing)

Questions

1

421

December 9, 2020

Computation Layer 101


1

139

January 7, 2026

Comp Layer Code Help

Questions

8

1052

November 20, 2020

Looking for a Collaborator for CL Coding

Discussion

10

881

May 28, 2018


### Desmos Demo - Content Sink (Providing Feedback) - Guess My Number Activity - Examples

Source: https://cl.desmos.com/t/desmos-demo-content-sink-providing-feedback-guess-my-number-activity/669


Desmos Demo - Content Sink (Providing Feedback) - Guess My Number Activity


RyanDLG1

(Ryan de la Garza)

January 11, 2020, 12:43pm

1

Hey y’all! I just finished up the next video in my Desmos Demo series where I break down how to use the content sink in your note component to give students immediate feedback. I tried something new with this one and added some additional support slides at the end as a review and would love any feedback/suggestions!

Video link:  https://youtu.be/iXPpsJ2OLvk

Activity link:  https://teacher.desmos.com/activitybuilder/custom/5e1403cd1c173c6e8becdb7c

Slide deck:  https://docs.google.com/presentation/d/1iceTxSwPIwswu-7gtyqOQXlOOcLO8HimM3t31pGdSz8/copy

1 Like

Daniel_Grubbs

January 13, 2020,  5:24pm

2

Maybe not for this video because it might complicate the objective of using the content sink, but…

If you use the capture sink in the input CL and lastValue in your feedback conditional, students would be required to click the “Submit” button (“Share with Class” in your example) before feedback is given

In input CL:

capture(“g”):this.numericValue

In note CL for feedback variable conditional:

instead of     {g}     use     {input1.lastValue(“g”)}

I like this because it avoids changing the feedback as soon as the correct guess appears. For example, if your number was actually 2, but a student was guessing 2.5, the feedback would say correct even though the student did not actually intend to guess 2.

1 Like

RyanDLG1

(Ryan de la Garza)

January 13, 2020,  5:42pm

3

This is a great idea! Someone in the Desmos Educators Facebook group brought up this issue and mentioned adding input1.submitted to the conditions in ordered to correct the issue . Do you feel like capture and lastValue could be a better solution?

Daniel_Grubbs

January 13, 2020,  5:56pm

4

Actually, yes that works better. I’ve just gotten used to using tables for answer entries, and capture works best for that.

So, I would just do a nested conditional:

when input1.submitted (

“your original conditionals”)

otherwise “”

RyanDLG1

(Ryan de la Garza)

January 13, 2020,  9:10pm

5

So I’ve actually never thought of using a .submitted on the outside to cover my previous conditionals but that’s a great idea!

The current method is:

When n=g and input1.submitted ____

And that’s repeated for each possible outcome. I’m definitely going to make that change in my practice though!

Can you talk to me about the benefit of capture over using “when timeSincePress>0”? That’s been my method for using tables but I’m always looking for more efficient/effective methods

Daniel_Grubbs

January 13, 2020,  9:43pm

6

If you use timeSincePress>0 and the student has an opportunity to change an answer, the feedback will automatically change once the correct answer is typed without having to resubmit. capture is a stored value when the button is pressed, so a student must press it again to get new feedback.

I often limit the number of times a submit button can be pressed so students can’t just put in guesses, particularly if I’m using it as an assessment. timeSincePress would give them unlimited opportunities.

I also use capture in combination with isEditable to lock a cell once a correct answer is submitted. I’ve had students accidentally delete answers in tables by accident.

Related topics

Topic

Replies

Views

Activity

Feedback for students

Questions

55

19016

April 5, 2022

Multiple choice submitted without explanation

Questions

9

1543

April 27, 2020

Hiding Note Until Correct Math Input

Questions

3

906

January 28, 2021

Hide submit button after student inputs correct answer

Questions

2

851

September 17, 2020

Still working on other options for Tests

Questions

8

436

May 25, 2021


Powered by  Discourse , best viewed with JavaScript enabled
