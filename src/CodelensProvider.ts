import * as vscode from "vscode";
import standardKeywordToUriMapping from "./standardMapping.json";
import { standardUrisToHideKey } from "./standardsToHide";

const buildKeywordMatchingRegex = () => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUriMapping).join("|"),
    "g"
  );

  return regex;
};
type StandardKeywordType = keyof typeof standardKeywordToUriMapping;

class MatchingKeywordCodeLens extends vscode.CodeLens {
  public matchingKeyword: StandardKeywordType;

  constructor(
    matchingKeyword: StandardKeywordType,
    range: vscode.Range,
    command?: vscode.Command
  ) {
    super(range, command);
    this.matchingKeyword = matchingKeyword;
  }
}

/**
 * CodelensProvider
 */
export class CodelensProvider
  implements vscode.CodeLensProvider<MatchingKeywordCodeLens>
{
  private codeLenses: MatchingKeywordCodeLens[] = [];
  private regex: RegExp;
  private globalState: vscode.Memento;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(globalState: vscode.Memento) {
    this.regex = buildKeywordMatchingRegex();
    this.globalState = globalState;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _: vscode.CancellationToken
  ): MatchingKeywordCodeLens[] | Thenable<MatchingKeywordCodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration("standard-jit")
        .get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      const urisToHide =
        this.globalState.get<string[]>(standardUrisToHideKey) || [];

      let matches;

      while ((matches = regex.exec(text)) !== null) {
        const matchedLine = document.lineAt(
          document.positionAt(matches.index).line
        );
        const matchedKeyword = matches[0] as StandardKeywordType;

        const matchedKeywordIndex = matchedLine.text.indexOf(matchedKeyword);
        const matchedKeywordPosition = new vscode.Position(
          matchedLine.lineNumber,
          matchedKeywordIndex
        );
        const matchedKeywordRange = document.getWordRangeAtPosition(
          matchedKeywordPosition,
          new RegExp(this.regex)
        );

        const areAllStandardsAssociatedWithKeywordHidden =
          standardKeywordToUriMapping[matchedKeyword].every((uri) => {
            return urisToHide.includes(uri);
          });

        if (
          matchedKeywordRange &&
          !areAllStandardsAssociatedWithKeywordHidden
        ) {
          this.codeLenses.push(
            new MatchingKeywordCodeLens(matchedKeyword, matchedKeywordRange)
          );
        }
      }

      return this.codeLenses;
    }

    return [];
  }

  public resolveCodeLens(
    codeLens: MatchingKeywordCodeLens,
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
          codeLens.matchingKeyword,
          standardKeywordToUriMapping[codeLens.matchingKeyword],
        ],
      };
      return codeLens;
    }
    return null;
  }
}
