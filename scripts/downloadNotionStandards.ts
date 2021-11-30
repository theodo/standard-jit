/* eslint-disable @typescript-eslint/naming-convention */
import { Client } from "@notionhq/client";
import { flatten, uniq } from "lodash";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const keywordPropertyName = "Keywords to match (standard-jit)";
const standardDatabaseId = "732673368f494fe6b46ffa3b63a5f9d5"; // to check, go to https://www.notion.so/m33/732673368f494fe6b46ffa3b63a5f9d5

type KeywordFieldType = {
  rich_text: {
    type: "text";
    text: {
      content: string;
      link: {
        url: string;
      } | null;
    };
    plain_text: string;
  }[];
};

(async () => {
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  const standardsDatabase = await notion.databases.query({
    database_id: standardDatabaseId,
    filter: {
      property: keywordPropertyName,
      title: {
        is_not_empty: true,
      },
    },
  });
  const standardsMappingInfo = standardsDatabase.results
    .map((standard) => ({
      keywordsFieldValue: (
        standard.properties[keywordPropertyName] as any as KeywordFieldType
      ).rich_text,
      url: standard.url,
    }))
    .filter(({ keywordsFieldValue }) => keywordsFieldValue.length !== 0)
    .map(({ keywordsFieldValue, url }) => ({
      keywords: keywordsFieldValue[0].plain_text.split("\n"),
      url,
    }));

  const keywords = uniq(
    flatten(standardsMappingInfo.map(({ keywords }) => keywords))
  );

  const keywordToStandardMapping = keywords.reduce<{
    [keyword: string]: string[];
  }>((mapping, keyword) => {
    return Object.assign(mapping, {
      [keyword]: standardsMappingInfo
        .filter(({ keywords }) => keywords.includes(keyword))
        .map(({ url }) => url),
    });
  }, {});

  fs.writeFileSync(
    "./src/standardMapping_UPDATED.json",
    JSON.stringify(keywordToStandardMapping)
  );
})();
