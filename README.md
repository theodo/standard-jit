# Standard-jit (Just-In-Time)

Display technical or business standards directly in your IDE !

:warning: DISCLAIMER :warning: This extension is intended to be used by M33 employees and co-workers. If you have any question please contact [AleBlondin](https://github.com/AleBlondin)

![extension demo gif](./docs/extension-standard-jit.gif)

## Installation

### Via the marketplace

Search for standard-jit, theodo or AleBlondin: https://marketplace.visualstudio.com/items?itemName=AleBlondin.standard-jit

### By hand

:warning: THIS IS DEPRECATED, no new releases will be published this way.

- On the [release page](https://github.com/theodo/standard-jit/releases), download latest release .vsix file
- run `code --install-extension standard-jit-[release-tag].vsix`. Be sure to launch this command in the directory you downloaded the release and to change `release-tag` with the release you chose !

### Checking the install

You may need to reload VSCode for the extension to start.

To check if the extension works correctly, try to type for example `lodash`, you should see a code lens displayed above the line.

You are all set !

---

## Extension Settings

This extension contributes the following settings (Files > Preferences > Settings > type "standard-jit"):

- `standard-jit.enableCodeLens`: enable/disable this extension
- `standard-jit.standardsToInclude`	Select which standards to show. Please note that you will need the appropriate Notion accesses. Default value is `[theodo]`

## Using the extension

Commands (via View > Command Palette):

- `Standard JIT: Enable`: activate extension
- `Standard JIT: Deactivate`: deactivate extension
- `Standard JIT: Unhide standards`: show again all standards previously hidden

## Standard mapping

To see which standards are currently linked with which keyword, see this [github repo](https://github.com/theodo/standard-jit-db).

For example, to check the `theodo` mapping, go to the appropriate [folder](https://github.com/theodo/standard-jit-db/blob/master/src/theodo/standardMapping.json)

---

**Enjoy!**
