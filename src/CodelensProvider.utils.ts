import { isArray, mergeWith } from "lodash";
import * as vscode from "vscode";

import { DBType } from "./remoteStandards";

export type StandardKeywordType = string;
export type StandardUrlType = { url: string; domain: string };
export type StandardMappingType = Record<
  StandardKeywordType,
  StandardUrlType[]
>;

export const buildKeywordMatchingRegex = (
  standardKeywordToUriMapping: StandardMappingType
) => {
  const regex = new RegExp(
    Object.keys(standardKeywordToUriMapping)
      .map((keyword) => keyword.replace(/(?=[(). \\])/g, "\\"))
      .join("|"),
    "g"
  );

  return regex;
};

export const getRangeAssociatedWithMatchedKeywordIndex = ({
  document,
  matchedKeywordIndex,
}: {
  document: vscode.TextDocument;
  matchedKeywordIndex: number;
}): vscode.Range | undefined => {
  const { lineNumber } = document.lineAt(
    document.positionAt(matchedKeywordIndex).line
  );

  const matchedKeywordPosition = new vscode.Position(lineNumber, 0);

  const matchedKeywordRange = new vscode.Range(
    matchedKeywordPosition,
    matchedKeywordPosition
  );

  return matchedKeywordRange;
};

export const isExtensionEnabled = () => {
  return vscode.workspace
    .getConfiguration("standard-jit")
    .get("enableCodeLens", true);
};

export const getDomainsToFetch = () => {
  return vscode.workspace
    .getConfiguration("standard-jit")
    .get("standardsToInclude") as DBType[];
};

export const mergeStandardMappings = ({
  sourceMapping,
  additionalMapping,
  additionalMappingDomain,
}: {
  sourceMapping: StandardMappingType;
  additionalMapping: StandardMappingType;
  additionalMappingDomain: string;
}) => {
  return mergeWith(
    sourceMapping,
    additionalMapping,
    (objValue: StandardUrlType[], srcValue: string[]) => {
      return [
        ...(isArray(objValue) ? objValue : []),
        ...srcValue.map((url: string) => ({
          domain: additionalMappingDomain,
          url,
        })),
      ];
    }
  );
};

export class StandardCodeLens extends vscode.CodeLens {
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
