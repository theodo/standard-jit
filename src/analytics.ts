import axios from "axios";

const ACTIONS = {
  HIDE: "hide",
  UNHIDE: "unhide",
  VISIT: "visit",
  BOOT: "boot",
  ERROR: "error",
} as const;
type ActionType = typeof ACTIONS[keyof typeof ACTIONS];

const airtableEndpoint =
  "https://hooks.airtable.com/workflows/v1/genericWebhook/appkWGJIoURg2P6we/wflXIH4C03Sln3sGt/wtreURbg1dFzUfIrk";

const postAnalytics = async ({
  url,
  action,
  context,
}: {
  url?: string;
  action: ActionType;
  context?: string;
}) => {
  console.log("context", context);
  await axios
    .post(airtableEndpoint, { redirect: url, action, context })
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
