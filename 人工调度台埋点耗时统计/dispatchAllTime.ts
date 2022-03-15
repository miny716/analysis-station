import superagent from "superagent";
import { getParams } from "./utils/params";
import { setParams } from "./utils/params";

async function getLoadingTime(
  key: string,
  start: string,
  end: string,
  cookie: string
) {
  const {
    body,
    body: {
      rawResponse: {
        hits: { hits },
      },
    },
  } = await superagent
    .post("https://kibana-rum.corp.imdada.cn/internal/search/es")
    .query({ format: "json" })
    .send(getParams(key, start, end)) // sends a JSON post body
    .set(setParams(cookie));

  return hits;
}

export default getLoadingTime;
