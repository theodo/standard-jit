import * as vscode from "vscode";

export const standardUrisToHideKey = "standardUrisToHide";

export const hideStandard =
  (state: vscode.ExtensionContext["globalState"]) => (standardUri: string) => {
    const standardUrisToHide = state.get<string[]>(standardUrisToHideKey);

    state.update(
      standardUrisToHideKey,
      standardUrisToHide
        ? Array.from(new Set([...standardUrisToHide, standardUri]))
        : [standardUri]
    );
  };

export const showStandard =
  (state: vscode.ExtensionContext["globalState"]) => (standardUri: string) => {
    const standardUrisToHide = state.get<string[]>(standardUrisToHideKey);
    if (!standardUrisToHide) {
      return;
    }

    var uriIndex = standardUrisToHide.indexOf(standardUri);
    if (uriIndex === -1) {
      return;
    }
    standardUrisToHide.splice(uriIndex, 1);

    state.update(standardUrisToHideKey, standardUrisToHide);
  };
