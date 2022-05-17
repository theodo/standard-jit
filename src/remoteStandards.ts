import axios from "axios";
import { notifyErrored } from "./analytics";

const remoteStandardBaseUri = "https://standard-jit.herokuapp.com";

export type ApiStandard = {
  url: string,
  keywords: string,
};

export type ApiStandardGroup = {
  id: number;
  name: string,
};

export const getStandards = async (groupName: string): Promise<ApiStandard[]> => {
  const standardGroups = await getStandardGroups();
  const matchingGroup = standardGroups.find(
    group => group.name.toLowerCase() === groupName.toLowerCase()
  );

  if(matchingGroup === undefined) {
    notifyErrored({context: `Group ${groupName} does not exist`});
    return [];
  }

  const { data } = await axios.get(`${remoteStandardBaseUri}/v1/standards`, {
    params: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      standard_group_id: matchingGroup.id
    }
  });

  return data;
};

const getStandardGroups = async (): Promise<ApiStandardGroup[]> => {
  const { data } = await axios.get(`${remoteStandardBaseUri}/v1/standard_groups`);
  return data;
};
