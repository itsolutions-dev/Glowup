# @its/scanner-zebra

## 0.1.0

### Minor Changes

- 0301d79: First release: the imager of Zebra mobile computers (the TC22 and the others DataWedge runs on)
  behind `@its/glowup-device/scanner`, as an Android Expo module and its adapter, through
  DataWedge's intent API: no SDK and no config plugin. The package creates the app's own DataWedge
  profile (intent output to the app, keystroke output off, UTF-8, every UPC digit) and writes each
  screen's symbologies in it, putting the profile's own decoders back for a screen without any.
  Measured on a TC22 (Android 15, DataWedge 15.0.96): QR, Code 128, GS1-128, EAN-13, EAN-8, UPC-A,
  UPC-E and Data Matrix by their label type, every other symbology off for the screen, UTF-8 text,
  the software trigger, the release in the background, other apps' wedge untouched.
