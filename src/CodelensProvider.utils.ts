import { isArray, mergeWith } from "lodash";
import * as vscode from "vscode";

export type KeywordType = string;
export type DomainScopedUrl = { url: string; domain: string; id: string };
export type KeywordToDomainScopedUrlMappingType = Record<
  KeywordType,
  DomainScopedUrl[]
>;

export const buildKeywordMatchingRegex = (
  standardKeywordToUriMapping: KeywordToDomainScopedUrlMappingType
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
    .get("standardsToInclude") as string[];
};

export const mergeStandardMappings = ({
  sourceMapping,
  additionalMapping,
  additionalMappingDomain,
}: {
  sourceMapping: KeywordToDomainScopedUrlMappingType;
  additionalMapping: KeywordToDomainScopedUrlMappingType;
  additionalMappingDomain: string;
}): KeywordToDomainScopedUrlMappingType => {
  return mergeWith(
    sourceMapping,
    additionalMapping,
    (objValue: DomainScopedUrl[] | undefined, srcValue: DomainScopedUrl[]) => {
      return [
        ...(isArray(objValue) ? objValue : []),
        ...srcValue,
      ];
    }
  );
};

export class StandardCodeLens extends vscode.CodeLens {
  public matchingKeyword: KeywordType;

  constructor(
    matchingKeyword: KeywordType,
    range: vscode.Range,
    command?: vscode.Command
  ) {
    super(range, command);

    this.matchingKeyword = matchingKeyword;
  }
}
