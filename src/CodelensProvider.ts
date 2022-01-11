import * as vscode from "vscode";
import axios from "axios";
import { isArray, mergeWith } from "lodash";
import { standardUrisToHideKey } from "./standardsToHide";
import { DBType, getRemoteStandardUri } from "./remoteStandards";

export type StandardKeywordType = string;
export type StandardUrlType = { url: string; domain: string };
export type StandardMappingType = Record<
  StandardKeywordType,
  StandardUrlType[]
>;

const buildKeywordMatchingRegex = (
  standardKeywordToUriMapping: StandardMappingType
) => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUriMapping)
      .map((keyword) => keyword.replace(/(?=[() \\])/g, "\\"))
      .join("|"),
    "g"
  );

  return regex;
};

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
    this.standardKeywordToUriMapping = {};
    this.regex = buildKeywordMatchingRegex(this.standardKeywordToUriMapping);
    this.globalState = globalState;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });

    const dbsToFetch = vscode.workspace
      .getConfiguration("standard-jit")
      .get("standardsToInclude") as DBType[];

    dbsToFetch.map((dbName) => {
      axios
        .get(getRemoteStandardUri(dbName))
        .then(({ data }: { data: StandardMappingType }) => {
          this.standardKeywordToUriMapping = mergeWith(
            this.standardKeywordToUriMapping,
            data,
            (objValue: StandardUrlType[], srcValue: string[]) => {
              return [
                ...(isArray(objValue) ? objValue : []),
                ...srcValue.map((url: string) => ({ domain: dbName, url })),
              ];
            }
          );

          this.regex = buildKeywordMatchingRegex(
            this.standardKeywordToUriMapping
          );
        })
        .catch((error) => {
          console.error(error);
        });
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
          this.standardKeywordToUriMapping[matchedKeyword].every(({ url }) => {
            return urisToHide.includes(url);
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
