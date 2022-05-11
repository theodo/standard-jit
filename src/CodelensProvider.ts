import * as vscode from "vscode";

import { standardUrisToHideKey } from "./standardsToHide";
import { ApiStandard, getStandards } from "./remoteStandards";
import { notifyErrored } from "./analytics";
import {
  buildKeywordMatchingRegex,
  getDomainsToFetch,
  getRangeAssociatedWithMatchedKeywordIndex,
  isExtensionEnabled,
  mergeStandardMappings,
  StandardCodeLens,
  KeywordToDomainScopedUrlMappingType,
} from "./CodelensProvider.utils";

export class CodelensProvider
  implements vscode.CodeLensProvider<StandardCodeLens>
{
  private regex: RegExp;
  private globalState: vscode.Memento;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  private standardKeywordToUriMapping: KeywordToDomainScopedUrlMappingType;

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(globalState: vscode.Memento) {
    this.standardKeywordToUriMapping = {};
    this.regex = buildKeywordMatchingRegex(this.standardKeywordToUriMapping);
    this.globalState = globalState;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });

    const domains = getDomainsToFetch();

    this.buildStandardMappingFromDomains({
      domains,
    });
  }

  private buildStandardMappingFromDomains({ domains }: { domains: string[] }) {
    domains.map((domain) => {
      getStandards(domain)
        .then((standards: ApiStandard[]) => {
          this.standardKeywordToUriMapping = mergeStandardMappings({
            sourceMapping: this.standardKeywordToUriMapping,
            additionalMapping: this.formatStandards(standards, domain),
            additionalMappingDomain: domain,
          });

          this.regex = buildKeywordMatchingRegex(
            this.standardKeywordToUriMapping
          );
        })
        .catch((err) => {
          notifyErrored({
            context: JSON.stringify({ domain, context: err?.message }),
          });

          console.error(err);
        });
    });
  }

  private isKeywordRegexInitialized() {
    const emptyRegex = new RegExp("", "g");

    return String(this.regex) !== String(emptyRegex);
  }

  private buildCodeLenseFromMatch(
    {
      matchedKeyword,
      index,
    }: {
      matchedKeyword: string;
      index: number;
    },
    document: vscode.TextDocument
  ) {
    const matchedKeywordRange = getRangeAssociatedWithMatchedKeywordIndex({
      document,
      matchedKeywordIndex: index,
    });

    const urisToHide =
      this.globalState.get<string[]>(standardUrisToHideKey) || [];

    const areAllStandardsAssociatedWithKeywordHidden =
      this.standardKeywordToUriMapping[matchedKeyword].every(({ url }) => {
        return urisToHide.includes(url);
      });

    if (matchedKeywordRange && !areAllStandardsAssociatedWithKeywordHidden) {
      return new StandardCodeLens(matchedKeyword, matchedKeywordRange);
    }
  }

  private formatStandards(standards: ApiStandard[], domain: string): KeywordToDomainScopedUrlMappingType {
    return standards.reduce<KeywordToDomainScopedUrlMappingType>(
      (formattedStandards, standard) => {
        const domainUrl = {url: standard.url, domain};
        standard.keywords.split(',').forEach(keyword => {
          if(keyword in formattedStandards) {
            formattedStandards[keyword].push(domainUrl);
          } else {
            formattedStandards[keyword] = [domainUrl];
          }
        });
        return formattedStandards;
      },
      {}
    );
  }

  private findAllMatches(document: vscode.TextDocument) {
    const regex = new RegExp(this.regex);
    const text = document.getText();

    let match;
    let allMatches = [];

    while ((match = regex.exec(text)) !== null) {
      const { 0: matchedKeyword, index } = match;

      allMatches.push({ matchedKeyword, index });
    }

    return allMatches;
  }

  private filterMultipleMatches(
    matches: {
      matchedKeyword: string;
      index: number;
    }[]
  ) {
    let matchedKeywords: string[] = [];
    let uniqueMatches: {
      matchedKeyword: string;
      index: number;
    }[] = [];

    matches.forEach((match) => {
      if (matchedKeywords.includes(match.matchedKeyword)) {
        return;
      }

      matchedKeywords.push(match.matchedKeyword);
      uniqueMatches.push(match);
    });

    return uniqueMatches;
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _: vscode.CancellationToken
  ): StandardCodeLens[] | Thenable<StandardCodeLens[]> {
    if (!isExtensionEnabled()) {
      return [];
    }

    if (!this.isKeywordRegexInitialized()) {
      return [];
    }

    const allMatches = this.findAllMatches(document);
    const uniqueAllMatches = this.filterMultipleMatches(allMatches);

    const codeLenses: StandardCodeLens[] = uniqueAllMatches
      .map(({ matchedKeyword, index }) =>
        this.buildCodeLenseFromMatch({ matchedKeyword, index }, document)
      )
      .filter((codeLens): codeLens is StandardCodeLens => !!codeLens);

    return codeLenses;
  }

  public resolveCodeLens(
    codeLens: StandardCodeLens,
    _: vscode.CancellationToken
  ) {
    if (!isExtensionEnabled()) {
      return null;
    }

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
}
