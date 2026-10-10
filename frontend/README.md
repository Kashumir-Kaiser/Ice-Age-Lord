# Ice Age Lord frontend prototype

The interface consumes the local demo `GameClient` projection. It does not connect to a game server or save campaign state.

Run `npm run assets:sync` before serving when registered art exports change. Build and dev startup validate `assets/manifest.json` and publish the manifest alongside the optimized SVG exports.

See the repository [asset art direction and registration guide](../assets/ART-DIRECTION.md) and the [isometric territory implementation report](../docs/implementation/TERRITORY-ISOMETRIC.md).
