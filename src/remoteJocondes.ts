import axios from "axios";

const remoteStandardBaseUri = "http://localhost:3000";

export type ApiStandardGroup = {
  id: number;
  name: string;
};

export const getJocondes = async (
  searchText: string,
  groupNames: string[]
): Promise<ApiStandardGroup[]> => {
  const { data } = await axios.get(`${remoteStandardBaseUri}/v1/jocondes`, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    params: { searchText, standard_group_names: groupNames },
    headers: { "x-api-key": "secret-standard-jit" },
  });
  console.log(data);

  return data;
};
