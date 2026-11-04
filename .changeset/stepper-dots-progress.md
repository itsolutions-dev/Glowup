---
"@its/glowup-ui": minor
---

**`Stepper`** takes **`variant="dots"`** and **`variant="progress"`**: a row of dots or a bar between Back and Next, for a form or a set of pages on a phone (the CRM's pages stepper). The buttons are drawn when `onBack` / `onNext` are passed (`backLabel`, `nextLabel`); Back calls `onCancel` on the first step and is disabled there without it; Next is disabled on the last step, unless `submitStep` makes it a filled `type="submit"` button for the enclosing `Form` (outside a `Form` it calls `onNext`). Many dots wrap onto more rows instead of pushing the buttons off the screen. Screen readers hear "Step 2 of 4". `steps` also takes a count. The default `variant="steps"` is unchanged.
