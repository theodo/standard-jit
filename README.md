# Standard-jit (Just-In-Time)

Display Theodo technical standards directly in your IDE !

![extension demo gif](./docs/extension-standard-jit.gif)

## Installation

- On the [release page](https://github.com/theodo/standard-jit/releases), download latest release .vsix file
- run `code --install-extension standard-jit-0.0.1.vsix`

You are all set !

If you want to temporarly enable/disable the extension:

- View > Command Palette > Standard JIT: Enable/Disable

To check if the extension works correctly, try to type for example `@material-ui`, you should see a code lens displayed above the line.

---

## Extension Settings

This extension contributes the following settings:

- `standard-jit.enableCodeLens`: enable/disable this extension

## Using the extension

Commands (via View > Command Palette):

- `Standard JIT: Enable`: activate extension
- `Standard JIT: Deactivate`: deactivate extension
- `Standard JIT: Unhide standards`: Show again all standards previously hidden

## Standard mapping

To see which standards are currently linked with which keyword, see this [reference file](https://github.com/theodo/standard-jit/blob/master/src/standardMapping.json)

---

**Enjoy!**
