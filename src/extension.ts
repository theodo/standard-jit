import * as vscode from "vscode";

import {
  notifyErrored,
  notifyExtensionStarted,
  notifyStandardClicked,
  notifyStandardHidden,
  notifyStandardsUnhidden,
} from "./analytics";
import { CodelensProvider } from "./CodelensProvider";
import { DomainScopedUrl } from "./CodelensProvider.utils";
import { hideStandard, standardUrisToHideKey } from "./standardsToHide";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = [];

type QuickPickItemType = "link" | "hide";
interface RedirectionQuickPickItem extends vscode.QuickPickItem {
  url: string;
  type: QuickPickItemType;
}

const notionPageIdentifier = "notion.so/";
const isNotionPage = (url: string) => url.includes(notionPageIdentifier);

/**
 * TODO: use a chain of responsability pattern
 * TODO: move to own file
 */
const formatLinkLabel = (
  matchedText: string,
  { url, domain }: DomainScopedUrl
) => {
  let formattedUrl = url;

  if (isNotionPage(url)) {
    try {
      formattedUrl = `${url
        .split(notionPageIdentifier)[1]
        .split("-")
        .slice(undefined, -1)
        .join(" ")}`;
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

export function activate(context: vscode.ExtensionContext) {
  notifyExtensionStarted();

  const codelensProvider = new CodelensProvider(context.globalState);

  vscode.languages.registerCodeLensProvider("*", codelensProvider);

  vscode.commands.registerCommand("standard-jit.enableCodeLens", () => {
    vscode.workspace
      .getConfiguration("standard-jit")
      .update("enableCodeLens", true, true);
  });

  vscode.commands.registerCommand("standard-jit.disableCodeLens", () => {
    vscode.workspace
      .getConfiguration("standard-jit")
      .update("enableCodeLens", false, true);
  });

  vscode.commands.registerCommand(
    "standard-jit.hideStandard",
    (standardUri: string) => {
      hideStandard(context.globalState)(standardUri);
    }
  );

  vscode.commands.registerCommand("standard-jit.unhideStandards", () => {
    notifyStandardsUnhidden();

    context.globalState.update(standardUrisToHideKey, undefined);
  });

  /**
   * TODO:
   * - get all context in extension constructor
   * - extract this function body into a function
   */
   vscode.commands.registerCommand(
    "standard-jit.codelensAction",
    (matchedText: string, matchedRessources: DomainScopedUrl[]) => {
      const quickPick = vscode.window.createQuickPick<RedirectionQuickPickItem>();
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
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
        if (type === "hide") {
          notifyStandardHidden({ url });
          vscode.commands.executeCommand("standard-jit.hideStandard", url);
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
