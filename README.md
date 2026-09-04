# Meditap

Meditap is a calm medication companion for tracking daily doses, checking adherence, and using NFC tags to log medication.

## What is included

- Apple-inspired mobile interface
- Dose timeline with local persistence
- Daily adherence and streak summary
- Reminder preference controls
- NFC scan experience with a preview/manual fallback
- Custom Meditap app icon

## Download Meditap

### Installable Android app

Download **`Meditap-android-v1.0.1.apk`** from the [v1.0.1 GitHub Release](https://github.com/nahhadi/meditap/releases/tag/v1.0.1). This is the signed, installable Android app.

1. On your Android phone, open the release page and download the APK.
2. If Android asks, allow your browser or file manager to install unknown apps. This permission is controlled by Android and is only needed for sideloading from GitHub.
3. Open the downloaded APK and confirm **Install**.

The APK targets Android devices running **Android 7.0 (API 24) or newer**. It is an internal sideload build, not a Google Play Store listing. The app does not request camera, location, contacts, or notification permissions.

### Developer source package

Use the Code button on this GitHub page and choose Download ZIP, or download **`meditap-source-v1.0.1.zip`** from the same release.

This is the complete developer source package. It is not an installable Android APK or iPhone application file.

## Run Meditap locally

1. Install Node.js and Expo Go.
2. Download or clone this repository.
3. In the project folder, run `npm install`.
4. Run `npx expo start`.
5. Scan the QR code with Expo Go to preview the app on a phone.

## About installable downloads

### Android permissions and NFC

The release APK uses local storage for the dose log and reminder preference. It does not currently request Android runtime permissions.

The NFC screen includes a preview/manual fallback. **This release does not perform native NFC tag reads** because the source is Expo Go-compatible and does not include a native NFC module. A future custom native build can add NFC hardware support and will document any additional permission or device requirements.

### iPhone

iOS does not allow a normal unsigned app to be installed directly from GitHub. Distribution requires Apple signing through TestFlight, an App Store release, or an approved ad-hoc/enterprise distribution method.

## License

Meditap is released under the MIT License. See LICENSE.
