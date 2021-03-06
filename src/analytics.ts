import axios from "axios";
import * as vscode from "vscode";

const ACTIONS = {
  HIDE: "hide",
  UNHIDE: "unhide",
  VISIT: "visit",
  BOOT: "boot",
  ERROR: "error",
} as const;
type ActionType = typeof ACTIONS[keyof typeof ACTIONS];

const airtableEndpoint =
  "https://gallant-wozniak-0ccf17.netlify.app/.netlify/functions/addrow";

const postAnalytics = async ({
  url,
  action,
  context,
}: {
  url?: string;
  action: ActionType;
  context?: string;
}) => {
  await axios
    .post(airtableEndpoint, {
      redirect: url,
      action,
      context,
      userId: vscode.env.machineId,
    })
    .catch((error) => {
      console.error(error);
    });
};

export const notifyStandardClicked = async ({ url }: { url: string }) => {
  await postAnalytics({ url, action: ACTIONS.VISIT });
};

export const notifyStandardHidden = async ({ url }: { url: string }) => {
  await postAnalytics({ url, action: ACTIONS.HIDE });
};

export const notifyStandardsUnhidden = async () => {
  await postAnalytics({ action: ACTIONS.UNHIDE });
};

export const notifyExtensionStarted = async () => {
  await postAnalytics({ action: ACTIONS.BOOT });
};

export const notifyErrored = async ({ context }: { context: string }) => {
  await postAnalytics({ action: ACTIONS.ERROR, context });
};
