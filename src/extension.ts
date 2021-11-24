// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  ExtensionContext,
  languages,
  commands,
  Disposable,
  workspace,
  window,
  env,
  Uri,
  QuickPickItem,
} from "vscode";
import { CodelensProvider } from "./CodelensProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: Disposable[] = [];

interface RedirectionQuickPickItem extends QuickPickItem {
  url: Uri;
}

const formatLinkLabel = (matchedText: string, url: string) => {
  try {
    return `${matchedText} -> ${url
      .split("/m33/")[1]
      .split("-")
      .slice(undefined, -1)
      .join("-")}`;
  } catch (e) {
    return url;
  }
};

export function activate(context: ExtensionContext) {
  const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider("*", codelensProvider);

  commands.registerCommand("standard-jit.enableCodeLens", () => {
    workspace
      .getConfiguration("standard-jit")
      .update("enableCodeLens", true, true);
  });

  commands.registerCommand("standard-jit.disableCodeLens", () => {
    workspace
      .getConfiguration("standard-jit")
      .update("enableCodeLens", false, true);
  });

  commands.registerCommand(
    "standard-jit.codelensAction",
    (matchedText: string, urls: string[]) => {
      const quickPick = window.createQuickPick<RedirectionQuickPickItem>();
      quickPick.canSelectMany = false;

      quickPick.items = urls.map((url: string) => ({
        label: formatLinkLabel(matchedText, url),
        url: Uri.parse(url),
      }));

      quickPick.onDidChangeSelection((selection) => {
        env.openExternal(selection[0].url);
      });

      quickPick.show();
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (disposables) {
    disposables.forEach((item) => item.dispose());
  }
  disposables = [];
}
