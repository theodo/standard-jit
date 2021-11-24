import * as vscode from "vscode";
import standardKeywordToUrlMapping from "./standardMapping.json";

const buildRegex = () => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUrlMapping).join("|"),
    "g"
  );

  return regex;
};

class CustomCodeLens extends vscode.CodeLens {
  public matchingStandardKeyword: string;

  constructor(
    matchingStandardKeyword: string,
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
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = buildRegex();

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
      let matches;

      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this.regex)
        );

        if (range) {
          this.codeLenses.push(new CustomCodeLens(matches[0], range));
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
          // @ts-ignore
          standardKeywordToUrlMapping[codeLens.matchingStandardKeyword],
        ],
      };
      return codeLens;
    }
    return null;
  }
}
