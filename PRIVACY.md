# Privacy

BrainrotMaxxing is designed as a local desktop app. It stores its workspace state, webview session data, imported cookies, and user-created modules in Electron app storage on the same machine.

## What Stays Local

- Saved layouts and startup defaults
- User-created module definitions
- Webview cookies and site storage
- Imported Chrome cookies
- Terminal command configuration and terminal output

The app does not intentionally send this data to the repository owner or to a custom backend.

## Third-Party Sites

Web tiles load third-party websites such as YouTube, X, news sites, and finance sites. Those sites can collect data according to their own privacy policies. Opening a web tile is equivalent to opening that site in an embedded browser session.

## Chrome Cookie Import

The cookie import helper is optional and local:

- It copies matching Chrome cookies from this Mac into the app's Electron session.
- It may ask macOS Keychain for Chrome Safe Storage access.
- It limits import to the configured Google/YouTube-related domains by default.
- It does not commit, print, or upload cookie values.

Use this feature only on your own machine and only for accounts you are allowed to use.

## Terminal Tiles

Terminal tiles run local commands with your local user permissions. Do not run module definitions from people you do not trust without reviewing their command, args, and working directory.

## Removing Local Data

Use the app controls to clear imported site cookies where available. You can also remove the Electron user data directory for the app from macOS Application Support if you want a full local reset.
