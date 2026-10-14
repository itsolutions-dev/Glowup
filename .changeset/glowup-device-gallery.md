---
"@its/glowup-device": minor
---

Two new subpaths for photos and videos: picking them, and saving them to the device's
library.

`/media-picker`, on `expo-image-picker` (an optional peer):

- `useMediaPicker().pick(options)` opens the system picker. No permission is needed on any
  platform.
- Options: `mediaTypes`, `multiple` with `limit`, `edit` with `aspect`, `quality` and `exif`.
  An invalid combination rejects with a `TypeError` before anything opens. That includes
  `edit` with `exif`: on iOS it would prompt for full library access just to read the EXIF.
- Every outcome resolves: `picked`, `cancelled`, `busy`, `unsupported` or `failed`.
- Picked assets are normalised: `duration` is in ms on every platform, and on the web each
  asset carries its `File`, ready for `FormData`.
- Only one pick runs at a time. expo would otherwise leave the first promise unanswered on iOS.
- `getPendingResult()` recovers a pick that Android interrupted by stopping the app.
- The web uses the package's own file-input adapter instead of expo's web build, and applies
  `limit`.
- `useAppLock` no longer locks on the way back from the picker, although Android sends the app
  to the background behind it.
- The config plugin key `mediaPicker` removes Android's `CAMERA` and `RECORD_AUDIO`, unless
  `camera` needs them.

`/media-library`, on `expo-media-library` (an optional peer):

- `useMediaLibrary().save(uri)` saves a local image or video. It keeps the original file and
  resolves `saved` (with the library's `assetId`), `denied`, `unsupported` or `failed`.
- `save()` asks for the permission only where saving needs it: iOS's add-only access, and
  storage on Android 10 and earlier. Android 11 and later save without a prompt. The
  permission state comes with `isRequired`, `request()` and `openSettings()`.
- Saving is unsupported on the web, and the web bundle never loads expo-media-library, whose
  default entry throws at import in a browser.
- The config plugin key `mediaLibrary: { savePermission }` writes the add-only purpose string.
  It also removes Android's `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`,
  `READ_MEDIA_VISUAL_USER_SELECTED` and `ACCESS_MEDIA_LOCATION`. Saving does not need them, and
  Google Play restricts them.

`/testing` adds `createMockMediaPickerAdapter()`, `buildPickedMedia()` and
`createMockMediaLibraryAdapter()`.
