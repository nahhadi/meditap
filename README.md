# Meditap

Meditap is a calm medication companion for tracking daily doses, checking adherence, and using NFC tags to log medication.

## What is included

- Apple-inspired mobile interface
- Dose timeline with local persistence
- Daily adherence and streak summary
- Reminder preference controls
- NFC scan experience with a preview/manual fallback
- Custom Meditap app icon

## Download the project

Use the Code button on this GitHub page and choose Download ZIP, or download the packaged source file from the repository's downloads folder.

This is the complete source package. It is not an already-signed Android APK or iPhone application file.

## Run Meditap locally

1. Install Node.js and Expo Go.
2. Download or clone this repository.
3. In the project folder, run npm install.
4. Run npx expo start.
5. Scan the QR code with Expo Go to preview the app on a phone.

## About installable downloads

### Android

An installable Android file is an APK. It must be built and signed for distribution. Once an APK is created, it can be attached to a GitHub Release for people to download directly.

### iPhone

iOS does not allow a normal unsigned app to be installed directly from GitHub. Distribution requires Apple signing through TestFlight, an App Store release, or an approved ad-hoc/enterprise distribution method.

## NFC note

The repository includes the complete scan flow and a safe preview fallback. Automatic native NFC reads require a native NFC module and a custom device build rather than the standard Expo Go client.

## License

Meditap is released under the MIT License. See LICENSE.
