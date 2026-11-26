---
"@its/glowup-ui": patch
---

The date fields' typing hint is spelled in the locale's letters as well as its order ("GG/MM/AAAA" in Italian, "TT.MM.JJJJ" in German; English's letters where the runtime has no `Intl.DisplayNames`), and a field you can type in shows the app's `placeholder` when one is given.
