import superagent from "superagent";
import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";

console.log("============");
var ResourceTimingCompression = require("resourcetiming-compression")
  .ResourceTimingCompression;

var { restiming, servertiming } = ResourceTimingCompression.getResourceTiming();

var ResourceTimingDecompression = require("resourcetiming-compression")
  .ResourceTimingDecompression;

ResourceTimingDecompression.HOSTNAMES_REVERSED = false;

const cookie =
  "uuid=d7983115-362c-478c-85ef-544eb0a5d801; device=08522850c92cfbef77d9427d1458ba4f; dauth=eyJhbGciOiJIUzI1NiJ9.eyJpc0dyb3VwQWNjb3VudCI6ZmFsc2UsInJlc291cmNlRnJvbSI6MSwiaXNzIjoiY29ycC5pbWRhZGEuY24iLCJhZG1pbiI6ZmFsc2UsImRlcHQiOm51bGwsInVhIjoiVFc5NmFXeHNZUzgxTGpBZ0tFMWhZMmx1ZEc5emFEc2dTVzUwWld3Z1RXRmpJRTlUSUZnZ01UQmZNVFZmTnlrZ1FYQndiR1ZYWldKTGFYUXZOVE0zTGpNMklDaExTRlJOVEN3Z2JHbHJaU0JIWldOcmJ5a2dRMmh5YjIxbEx6azFMakF1TkRZek9DNDFOQ0JUWVdaaGNta3ZOVE0zTGpNMiIsInV1aWQiOiJkNzk4MzExNS0zNjJjLTQ3OGMtODVlZi01NDRlYjBhNWQ4MDEiLCJzZWN1cml0eUxldmVsIjozLCJsb2dpblRpbWUiOjE2MzU0NzM2NjY3MDAsInBob25lIjoiMTgzNTE5MjU5MTIiLCJjaGluZXNlTmFtZSI6IjZKR2o1cGlPNXBpTyIsImV4cCI6MTYzNTUzNzYwMSwiaWF0IjoxNjM1NDczNjY2LCJlbWFpbCI6ImRvbmdtaW5nbWluZ0BpbWRhZGEuY24iLCJqdGkiOiJkb25nbWluZ21pbmciLCJ1c2VybmFtZSI6ImRvbmdtaW5nbWluZyJ9.SL343Q7TZ6uKOkAUv0_bUthhrG-1XCuW-oTgZ30T_AE";
const params = {
  params: {
    index: "rum-data-*",
    body: {
      version: true,
      size: 10000,
      sort: [{ timestamp: { order: "desc", unmapped_type: "boolean" } }],
      aggs: {
        "2": {
          date_histogram: {
            field: "timestamp",
            fixed_interval: "3h",
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
          must: [
            {
              query_string: {
                query:
                  "data.location.hostname:portal.imdada.cn AND data.http_initiator:(spa_hard OR spa) AND NOT _exists_:data.rt_quit",
                analyze_wildcard: true,
                time_zone: "Asia/Shanghai",
              },
            },
          ],
          filter: [
            {
              match_phrase: {
                "data.location.hash": "/system/dispatch/station",
              },
            },
            {
              range: {
                timestamp: {
                  gte: "2021-10-22T16:00:00.000Z",
                  lte: "2021-10-28T16:00:00.000Z",
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
    preference: 1635473668922,
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

  console.log("=====data", hits.length);
  const data = hits.map((item: any) => {
    let {
      fields: { timestamp },
      _source: {
        data: { t_done, _portal_apiOrderCountTime, _portal_apiOrderListTime },
        memo: { restiming },
        beacon_id,
      },
    } = item;

    // console.log("item", JSON.stringify(restiming));

    restiming = restiming
      ? ResourceTimingDecompression.decompressResources(JSON.parse(restiming))
      : [];

    const list = [
      "https://portal.imdada.cn/dcOperation/dispatch/order/counts",
      "https://portal.imdada.cn/dcOperation/dispatch/order/list",
    ];

    const apiTimeArr = restiming
      ?.filter((item: any) => {
        return list.includes(item.name);
      })
      ?.map((item: any) => {
        return Number(item.duration);
      });

    const maxTime = !apiTimeArr.length
      ? "jump"
      : apiTimeArr.length === 2
      ? Math.max(...apiTimeArr)
      : beacon_id;

    console.log("======res", maxTime);

    // console.log(restiming.filter((item: any) => list.includes(item.name)));

    return [
      timestamp[0],
      t_done,
      maxTime,
      beacon_id,
      _portal_apiOrderCountTime,
      _portal_apiOrderListTime,
    ];
  });

  const buffer: any = xlsx.build([
    {
      name: "worksheets",
      data: [
        [
          "timestamp",
          "t_done",
          "maxTimeApi",
          "beacon_id",
          "_portal_apiOrderCountTime",
          "_portal_apiOrderListTime",
        ],
        ...data,
      ],
    },
  ]);
  fs.writeFileSync(
    path.resolve(`./dispatch/1023-1028-frontApiRes.xlsx`),
    buffer,
    {
      flag: "w",
    }
  );
};

getLoadingTime("https://kibana-rum.corp.imdada.cn/internal/search/es");

export default getLoadingTime;
