import * as vscode from "vscode";
import defaultStandardKeywordToUriMapping from "./standardMapping.json";
import { standardUrisToHideKey } from "./standardsToHide";

const remoteStandardUri =
  "https://raw.githubusercontent.com/theodo/standard-jit-db/master/src/standardMapping.json";

const buildKeywordMatchingRegex = (
  standardKeywordToUriMapping: StandardMappingType
) => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUriMapping).join("|"),
    "g"
  );

  return regex;
};
type StandardKeywordType = keyof typeof defaultStandardKeywordToUriMapping;
type StandardMappingType = Record<StandardKeywordType, string[]>;

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
  private standardKeywordToUriMapping: StandardMappingType;

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(globalState: vscode.Memento) {
    this.standardKeywordToUriMapping = defaultStandardKeywordToUriMapping;
    this.regex = buildKeywordMatchingRegex(defaultStandardKeywordToUriMapping);
    this.globalState = globalState;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });

    fetch(remoteStandardUri)
      .then((response) => response.json())
      .then((data) => {
        this.regex = buildKeywordMatchingRegex(data);
        this.standardKeywordToUriMapping = data;
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
          this.standardKeywordToUriMapping[matchedKeyword].every((uri) => {
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
          this.standardKeywordToUriMapping[codeLens.matchingKeyword],
        ],
      };
      return codeLens;
    }
    return null;
  }
}
