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
import {
  notifyErrored,
  notifyExtensionStarted,
  notifyStandardClicked,
  notifyStandardHidden,
  notifyStandardsUnhidden,
} from "./analytics";
import { CodelensProvider, StandardUrlType } from "./CodelensProvider";
import { hideStandard, standardUrisToHideKey } from "./standardsToHide";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: Disposable[] = [];

type QuickPickItemType = "link" | "hide";
interface RedirectionQuickPickItem extends QuickPickItem {
  url: string;
  type: QuickPickItemType;
}

const formatLinkLabel = (
  matchedText: string,
  { url, domain }: StandardUrlType
) => {
  let formattedUrl = url;

  if (url.includes("/m33/")) {
    try {
      formattedUrl = `${url
        .split("/m33/")[1]
        .split("-")
        .slice(undefined, -1)
        .join("-")}`;
    } catch (e: any) {
      console.error({ e });
      notifyErrored({
        context: JSON.stringify({
          message: e?.message,
          url,
          matchedText,
          domain,
        }),
      });
    }
  }

  return `[${domain}] ${matchedText} -> ${formattedUrl}`;
};

export function activate(context: ExtensionContext) {
  notifyExtensionStarted();

  const codelensProvider = new CodelensProvider(context.globalState);

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
    "standard-jit.hideStandard",
    (standardUri: string) => {
      hideStandard(context.globalState)(standardUri);
    }
  );

  commands.registerCommand("standard-jit.unhideStandards", () => {
    notifyStandardsUnhidden();

    context.globalState.update(standardUrisToHideKey, undefined);
  });

  commands.registerCommand(
    "standard-jit.codelensAction",
    (matchedText: string, matchedRessources: StandardUrlType[]) => {
      const quickPick = window.createQuickPick<RedirectionQuickPickItem>();
      quickPick.canSelectMany = false;

      const urisToHide =
        context.globalState.get<string[]>(standardUrisToHideKey) || [];
      const ressourcesToDisplay = matchedRessources.filter(
        ({ url }) => !urisToHide.includes(url)
      );

      const linkQuickPickItems = ressourcesToDisplay.map((ressource) => ({
        label: formatLinkLabel(matchedText, ressource),
        url: ressource.url,
        type: "link" as QuickPickItemType,
      }));
      const hideQuickPickItems = ressourcesToDisplay.map((ressource) => ({
        label: `Hide this standard: ${formatLinkLabel(matchedText, ressource)}`,
        url: ressource.url,
        type: "hide" as QuickPickItemType,
      }));

      quickPick.items = [...linkQuickPickItems, ...hideQuickPickItems];

      quickPick.onDidChangeSelection((selection) => {
        const { type, url } = selection[0];

        if (type === "link") {
          notifyStandardClicked({ url });
          env.openExternal(Uri.parse(url));
        }
        if (type === "hide") {
          notifyStandardHidden({ url });
          commands.executeCommand("standard-jit.hideStandard", url);
        }

        quickPick.dispose();
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
