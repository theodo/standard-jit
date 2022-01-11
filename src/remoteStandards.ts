export const remoteStandardBaseUri =
  "https://raw.githubusercontent.com/theodo/standard-jit-db/master/src/";
const standardMappingFileName = "standardMapping.json";

export const getRemoteStandardUri = (db: string) => {
  return `${remoteStandardBaseUri}${db}/${standardMappingFileName}`;
};

export type DBType = "theodo" | "bpi";
