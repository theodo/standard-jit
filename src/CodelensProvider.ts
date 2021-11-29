import * as vscode from "vscode";
import standardKeywordToUrlMapping from "./standardMapping.json";
import { standardUrisToHideKey } from "./standardsToHide";

const buildRegex = () => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUrlMapping).join("|"),
    "g"
  );

  return regex;
};
type StandardKeywordType = keyof typeof standardKeywordToUrlMapping;

class CustomCodeLens extends vscode.CodeLens {
  public matchingStandardKeyword: StandardKeywordType;

  constructor(
    matchingStandardKeyword: StandardKeywordType,
    range: vscode.Range,
    command?: vscode.Command
  ) {
    super(range, command);
    this.matchingStandardKeyword = matchingStandardKeyword;
  }
}

/**
 * CodelensProvider
 */
export class CodelensProvider
  implements vscode.CodeLensProvider<CustomCodeLens>
{
  private codeLenses: CustomCodeLens[] = [];
  private regex: RegExp;
  private globalState: vscode.Memento;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(globalState: vscode.Memento) {
    this.regex = buildRegex();
    this.globalState = globalState;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _: vscode.CancellationToken
  ): CustomCodeLens[] | Thenable<CustomCodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration("standard-jit")
        .get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      const urlsToHide =
        this.globalState.get<string[]>(standardUrisToHideKey) || [];

      let matches;

      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        const matchedKeyword =
          matches[0] as StandardKeywordType;

        const indexOf = line.text.indexOf(matchedKeyword);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this.regex)
        );

        const areAllStandardsAssociatedWithKeywordHidden =
          standardKeywordToUrlMapping[matchedKeyword].every((url) => {
            return urlsToHide.includes(url);
          });

        if (range && !areAllStandardsAssociatedWithKeywordHidden) {
          this.codeLenses.push(new CustomCodeLens(matchedKeyword, range));
        }
      }

      return this.codeLenses;
    }

    return [];
  }

  public resolveCodeLens(
    codeLens: CustomCodeLens,
    _: vscode.CancellationToken
  ) {
    if (
      vscode.workspace
        .getConfiguration("standard-jit")
        .get("enableCodeLens", true)
    ) {
      codeLens.command = {
        title: "Some technical standards may be of interest to you",
        tooltip: "",
        command: "standard-jit.codelensAction",
        arguments: [
          codeLens.matchingStandardKeyword,
          standardKeywordToUrlMapping[codeLens.matchingStandardKeyword],
        ],
      };
      return codeLens;
    }
    return null;
  }
}
