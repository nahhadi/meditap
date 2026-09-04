# Sharing Meditap from GitHub

## Recommended GitHub flow

1. Keep the source code in the public nahhadi/meditap repository.
2. Use Code then Download ZIP when someone wants the source.
3. Use GitHub Releases for installable Android APK files once a signed APK has been built.
4. Put release notes, supported Android versions, and a short installation guide in each release.

## Important platform difference

A source ZIP is useful for developers but is not an installable mobile app. Android users need a signed .apk. iPhone users need an Apple-signed distribution method such as TestFlight or an App Store build. GitHub can host these files, but it cannot remove Apple or Android signing requirements.

## Current package

The first GitHub package contains the Meditap Expo source and a downloadable source ZIP. The NFC UI and preview flow are ready; automatic native NFC reading should be added in a custom native build before promising tag-based installation to end users.
