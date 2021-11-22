import * as vscode from "vscode";
import { parse } from "@typescript-eslint/parser";
// @ts-ignore
import Traverser from "./traverser";

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /(.+)/g;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration("standard-jit")
        .get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const parsedFile = parse(document.getText(), { loc: true });
    //   console.log(parsedFile);

      Traverser.traverse(parsedFile, {
        enter(node: any, parent: any) {
          console.log({ node });
          node.parent = parent;
        },
        leave(node: any) {},
      });
    }
    return [];
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace
        .getConfiguration("standard-jit")
        .get("enableCodeLens", true)
    ) {
      codeLens.command = {
        title: "Codelens provided by sample extension",
        tooltip: "Tooltip provided by sample extension",
        command: "standard-jit.codelensAction",
        arguments: ["Argument 1", false],
      };
      return codeLens;
    }
    return null;
  }
}
