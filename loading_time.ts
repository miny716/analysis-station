import superagent from "superagent";
import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";

const cookie =
  "uuid=d7983115-362c-478c-85ef-544eb0a5d801; device=08522850c92cfbef77d9427d1458ba4f; dauth=eyJhbGciOiJIUzI1NiJ9.eyJpc0dyb3VwQWNjb3VudCI6ZmFsc2UsInJlc291cmNlRnJvbSI6MSwiaXNzIjoiY29ycC5pbWRhZGEuY24iLCJhZG1pbiI6ZmFsc2UsImRlcHQiOm51bGwsInVhIjoiVFc5NmFXeHNZUzgxTGpBZ0tFMWhZMmx1ZEc5emFEc2dTVzUwWld3Z1RXRmpJRTlUSUZnZ01UQmZNVFZmTnlrZ1FYQndiR1ZYWldKTGFYUXZOVE0zTGpNMklDaExTRlJOVEN3Z2JHbHJaU0JIWldOcmJ5a2dRMmh5YjIxbEx6azBMakF1TkRZd05pNDNNU0JUWVdaaGNta3ZOVE0zTGpNMiIsInV1aWQiOiJkNzk4MzExNS0zNjJjLTQ3OGMtODVlZi01NDRlYjBhNWQ4MDEiLCJzZWN1cml0eUxldmVsIjozLCJsb2dpblRpbWUiOjE2MzUzODU5MzEwODgsInBob25lIjoiMTgzNTE5MjU5MTIiLCJjaGluZXNlTmFtZSI6IjZKR2o1cGlPNXBpTyIsImV4cCI6MTYzNTQ1MTIwMSwiaWF0IjoxNjM1Mzg1OTMxLCJlbWFpbCI6ImRvbmdtaW5nbWluZ0BpbWRhZGEuY24iLCJqdGkiOiJkb25nbWluZ21pbmciLCJ1c2VybmFtZSI6ImRvbmdtaW5nbWluZyJ9.7m7iwnikGpI4mFfUMUOgIMUGCgkR-1wpn3TvnLC89aY";
const params = {
  params: {
    index: "rum-data-*",
    body: {
      version: true,
      size: 5000,
      sort: [{ timestamp: { order: "desc", unmapped_type: "boolean" } }],
      aggs: {
        "2": {
          date_histogram: {
            field: "timestamp",
            fixed_interval: "30m",
            time_zone: "Asia/Shanghai",
            min_doc_count: 1,
          },
        },
      },
      stored_fields: ["*"],
      script_fields: {},
      docvalue_fields: [{ field: "timestamp", format: "date_time" }],
      _source: { excludes: [] },
      query: {
        bool: {
          must: [],
          filter: [
            {
              bool: {
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          match: {
                            "data.location.hostname": "portal.imdada.cn",
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                  {
                    bool: {
                      filter: [
                        {
                          bool: {
                            should: [
                              {
                                bool: {
                                  should: [
                                    {
                                      match: {
                                        "data.http_initiator": "spa_hard",
                                      },
                                    },
                                  ],
                                  minimum_should_match: 1,
                                },
                              },
                              {
                                bool: {
                                  should: [
                                    { match: { "data.http_initiator": "spa" } },
                                  ],
                                  minimum_should_match: 1,
                                },
                              },
                            ],
                            minimum_should_match: 1,
                          },
                        },
                        {
                          bool: {
                            must_not: {
                              bool: {
                                should: [
                                  { match: { _exists_: "data.rt_quit" } },
                                ],
                                minimum_should_match: 1,
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              match_phrase: {
                "data.location.hash": "/system/dispatch/station",
              },
            },
            {
              range: {
                timestamp: {
                  gte: "2021-10-26T16:00:00.000Z",
                  lte: "2021-10-27T16:00:00.000Z",
                  format: "strict_date_optional_time",
                },
              },
            },
          ],
          should: [],
          must_not: [],
        },
      },
      highlight: {
        pre_tags: ["@kibana-highlighted-field@"],
        post_tags: ["@/kibana-highlighted-field@"],
        fields: { "*": {} },
        fragment_size: 2147483647,
      },
    },
    rest_total_hits_as_int: true,
    ignore_unavailable: true,
    ignore_throttled: true,
    preference: 1635401599182,
    timeout: "30000ms",
  },
};

const getLoadingTime = async (url: string) => {
  const {
    body: {
      rawResponse: {
        hits: { hits },
      },
    },
  } = await superagent
    .post(url)
    .query({ format: "json" })
    .send(params) // sends a JSON post body
    .set({
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "kbn-version": "7.9.3",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie: cookie,
      referrer: "https://kibana-rum.corp.imdada.cn/app/discover",
      referrerPolicy: "strict-origin-when-cross-origin",
      mode: "cors",
    });
  const data = hits.map((item: any) => {
    const {
      fields: { timestamp },
      _source: {
        data: { t_done },
      },
    } = item;
    return [timestamp[0], t_done];
  });

  const buffer: any = xlsx.build([
    { name: "worksheets", data: [["timestamp", "t_done"], ...data] },
  ]);
  fs.writeFileSync(path.resolve(`./resident/1024.xlsx`), buffer, {
    flag: "w",
  });
};

getLoadingTime("https://kibana-rum.corp.imdada.cn/internal/search/es");

export default getLoadingTime;
