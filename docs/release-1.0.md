# Glowup 1.0: criteria, policies, adoption guide (draft)

**Status: draft of 2026-11-02, to be decided by whoever owns the releases** (not Alice: the publishing of the
packages and their policies are not hers to set, 2/11). Item 1.13 of `solaris-native.md` (decisions D15 and D16, both
still "Proposta" there). Nothing here is in force until the decisions below are taken; then §2–§4 move into the
packages' READMEs and `CLAUDE.md`, and §5 becomes the getting-started page.

## Decisions to take

Open questions for the owners of the releases, each with the recommendation of the draft; the rest of the document
is written as if it were accepted. Decision D (the branch) was already listed in `status.md` for Alice, Adriano and
Gabriele together.

| #   | Question                                                                                                           | Recommendation                                                                                                                                                                                    | Why                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Which packages reach 1.0?                                                                                          | **`@its/glowup-ui` only.** `device`, `notifications`, `pdf`, `charts`, `pivot` publish first as `0.1.0` and go 1.0 one by one, each with its own row in §1.                                       | `ui` is what every screen uses and the most verified (`device-testing/native-verification.md`). Two of the others were never on npm, three are still `private`: a 1.0 for them would be a first release with a promise attached. |
| B   | Which Expo SDKs does 1.0 support? (D16)                                                                            | **The current SDK and the one before.** Today that means **58 and 57**: move the repo to 58 before 1.0 (the note in `status.md`, "Deferred"), keep CI bundling `examples/consumer` on 57 as well. | An app on the newest SDK must be able to adopt it, and one SDK behind must not be locked out. A 1.0 on 57 alone would start out a version behind (Expo Go already runs only 58).                                                 |
| C   | How long is a deprecation? (D15)                                                                                   | **At least one minor**, with a warning in development, removal only in the next major.                                                                                                            | The plan's own rule; short enough for a small team, long enough for an app to update in one release.                                                                                                                             |
| D   | Which line publishes 1.0?                                                                                          | **One line, `master`, after `dev` is merged into it through a PR** (Stage 5).                                                                                                                     | A 1.0 promises one API. `master`'s 0.12.0 and `dev` have diverged (160 and 105 commits); two published lines would make two different 1.0s.                                                                                      |
| E   | Is a real phone required for 1.0?                                                                                  | **One real Android phone, yes; a real iPhone, no** (the simulator in CI plus the Mac's simulator by hand).                                                                                        | `status.md`'s "done means" already asks for one real Android phone. A real iPhone needs an Apple Developer account or the Mac; it should not block the release.                                                                  |
| F   | What do B3 and B4 do? (`ToggleButtonGroup` typed values, `Stepper` dots or bar, `DayTimeline`, `Skeleton` presets) | **Deferred**, built when a screen asks.                                                                                                                                                           | They are additions: a minor after 1.0 can bring them without breaking anything. No pilot screen needed them.                                                                                                                     |

## 1. What 1.0 means: the criteria

`@its/glowup-ui` is 1.0 when every line below is ticked, each with its proof noted in a handoff.

| Criterion                                                                                                                                                                                                                                                               | State on 2/11                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **API settled.** No rename or contract change planned: what would break goes in before 1.0 or waits for 2.0.                                                                                                                                                            | ✅ Rename batch 3 dropped (28/10); no breaking change pending.                                                         |
| **Tests on three platforms in CI**: the suite as iOS and as Android, the web set, green on every push to `dev` and `master`.                                                                                                                                            | ✅ Since 2/11 (`ci.yml` on `dev` too).                                                                                 |
| **Verified per platform** (`device-testing/native-verification.md`): web ✅ for every row; Android emulator ✅ for every row; iPhone simulator at least ◐ for every row; one real Android phone through the pilot components; a VoiceOver pass on the pilot components. | ◐ Web and Android emulator nearly complete; iPhone about a third, nothing tapped; no real phone; no VoiceOver.         |
| **Screen readers**: a TalkBack and a VoiceOver pass on the pilot components, every finding fixed or listed under "known limits".                                                                                                                                        | ◐ TalkBack done (2/11, four fixes); VoiceOver not started.                                                             |
| **Documented**: every exported component in `components.md` and the generated prop tables; this guide (§5) on the site; known limits listed.                                                                                                                            | ◐ Components and props yes; the guide is this draft.                                                                   |
| **Published from one line** (decision D), with `examples/consumer` installing it from npm and bundling it for web, iOS and Android.                                                                                                                                     | – `device` and `notifications` were never published; the 22/10 release failed after `ui`; the branch question is open. |
| **Migration guide from 0.12.0** (what `master` published) to 1.0 in the `CHANGELOG`: the renames of batches 1 and 2, `Select multiple`, `ConfirmDialog` → `AlertDialog`, `Input` / `InputArea`, the fields' naming on Android.                                          | – Not written. The changesets on `dev` (45) are its raw material.                                                      |
| **Known limits accepted**: each limit in `status.md` ("Library hardening", "Left") and `device-testing/native-verification.md` is fixed, or kept on purpose and written in the guide.                                                                                   | ◐ Listed; not yet decided one by one.                                                                                  |

## 2. Versions and deprecation (D15)

- **Semantic versioning, strictly, from 1.0.** A patch fixes without changing what works; a minor adds (new components,
  new optional props) without changing what exists; a major is the only place for a removal or an incompatible change.
- **An added prop never changes the behaviour of the existing ones** (the plan's "additive and stable" rule).
- **Deprecating something**: in a minor, the old name or prop keeps working, is marked `@deprecated` in its type (so
  editors strike it through), says so once per session with a `console.warn` in development only (`__DEV__`), and its
  replacement is in the changeset and the guide. It is removed in the next major, never earlier than one minor after
  the deprecation.
- **What counts as breaking**: a removed or renamed export or prop; a prop whose type gets narrower; a changed default;
  a changed callback signature; a visual change an app would have to undo; a raised minimum of a peer dependency or
  of the Expo SDK. A bug fix that makes a component do what its documentation says is not breaking, even when an app
  relied on the bug (the changeset says so).
- **Before 1.0** (now): breaking changes are allowed in a minor, but batched, with a migration note in the changeset.

## 3. Expo SDK and platform support (D16)

- **Expo SDK**: the current one and the one before (decision B: 58 and 57). The supported SDKs are written in the
  README and in the packages' peer ranges. When Expo releases a new SDK, the repo moves to it in a dedicated minor
  (all native versions together, never one by one, as `CLAUDE.md` says), the oldest SDK drops out in the next major,
  and CI bundles `examples/consumer` on both supported SDKs.
- **Operating systems**: what the SDK itself supports. On SDK 57: **iOS 15.1 and later**, **Android 7.0 (API 24) and
  later** (React Native 0.86's minimums). Exceptions are per feature and written where they apply; today one:
  searching a PDF needs Android 15 or SDK extension 13 (`PdfRenderer`), and is off below.
- **Browsers**: the last two versions of Chrome, Edge, Firefox and Safari, on desktop and on phones. The web build is
  checked in Chrome; Safari on an iPhone is the case to try by hand.
- **React Native's New Architecture**: the only one (SDK 57 has no other).

## 4. Where the policy is written

Once the decisions are taken: §2 and §3 in `packages/ui/README.md` (a "Support and versions" section near the top), a
short pointer in `CLAUDE.md` (Releasing), and the supported SDKs in each package's peer ranges.

## 5. Adoption guide: Glowup in an Expo app

The draft of the getting-started page (it extends `packages/ui/README.md`'s "Installation" and "Usage").

**1. Install** the library and the peers your app does not have yet:

```bash
npm install @its/glowup-ui
npx expo install react-native-safe-area-context react-native-svg @expo/vector-icons
```

**2. Load the fonts before the first screen.** Android measures text with the font it has when the text first draws
and does not measure it again: a brand font that arrives later leaves labels cut ("Sav", "Dai…", seen on 29/10).
Register the icon font and any font your palette names, and render nothing until they are loaded:

```tsx
import { useFonts } from "expo-font";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const [loaded] = useFonts({
  ...MaterialCommunityIcons.font /* , your palette's fonts */,
});
if (!loaded) return null;
```

**3. Wrap the app in the providers**: `ThemeProvider` (palette, light or dark), then `AlertProvider` and
`ToastProvider` if you use `Alert()` or `useToast()`. A `SafeAreaProvider` is not required: without one the insets
are zero.

**4. Web-only apps** work the same way, through `react-native-web` (it brings `react-dom`). For a static export, also
register the icon font in the root layout so the prerendered HTML has the icons (README, "Static web export").

**5. Accessibility your code owns.** The library names, roles and states its own controls; four cases are the app's:

- a `Button` with only an icon, and every `IconButton`, needs `accessibilityLabel` (icons are never read);
- a `Switch` without `label`, as in a `ListItem`'s `action`, needs `accessibilityLabel`, usually the row's title;
- a picture that is information, not decoration, needs a name (`Avatar` takes `name`);
- a field's name is its `label`; pass `inputProps.accessibilityLabel` only to say something the label does not.

**6. Haptics**: the library plays none; pass `@its/glowup-device`'s `hapticFeedback` to `ThemeProvider`'s
`onInteractionFeedback` to have them on every control.

**7. The add-on packages** (`charts`, `pivot`, `pdf`) import `@its/glowup-ui` and nothing else of ours. Their native
features take optional peers: `expo-file-system` and `expo-sharing` for the pivot's `.xlsx` export, `expo-print`
and `expo-sharing` for printing and sharing a PDF. Without them the app still builds; the feature says it is
unavailable.

**8. Known limits** (from `device-testing/native-verification.md` and `status.md`): to be filled in once each limit is
decided (criterion "known limits accepted").
