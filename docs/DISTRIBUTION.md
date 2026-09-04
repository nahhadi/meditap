# Sharing Meditap from GitHub

## Release v1.0.1

The [v1.0.1 release](https://github.com/nahhadi/meditap/releases/tag/v1.0.1) has two intentionally different downloads:

- **`Meditap-android-v1.0.1.apk`** — signed and installable on supported Android devices.
- **`meditap-source-v1.0.1.zip`** — developer source only; it cannot be installed as an app.

### Installing the APK

1. Download the APK from the release page on an Android phone.
2. If prompted, allow the browser or file manager to install unknown apps.
3. Open the APK and confirm the installation.

The APK supports Android **7.0/API 24 and newer**. This is a sideload build for direct testing and personal use, not a Google Play Store package.

## Permissions and NFC

The release app stores the dose log and reminder setting locally. It requests no camera, location, contacts, or notification runtime permissions. The “allow unknown apps” setting belongs to Android's sideload flow, not to the app.

The NFC screen is a safe preview/manual flow in this release. Native NFC tag reading is not included because it requires a native NFC module and a custom device build. Do not describe this APK as automatically reading NFC tags.

## Source development

Use the source ZIP or the repository's Code → Download ZIP option for development. Install Node.js and Expo Go, run `npm install`, then `npx expo start` to preview the app.

## Important platform difference

iPhone users need an Apple-signed distribution method such as TestFlight or an App Store build. GitHub can host source files and Android APKs, but it cannot remove Apple or Android signing requirements.
