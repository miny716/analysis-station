import superagent from "superagent";
import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";

console.log("============");
// var ResourceTimingCompression = require("resourcetiming-compression")
//   .ResourceTimingCompression;

// var { restiming, servertiming } = ResourceTimingCompression.getResourceTiming();

var ResourceTimingDecompression = require("resourcetiming-compression")
  .ResourceTimingDecompression;

ResourceTimingDecompression.HOSTNAMES_REVERSED = false;

const cookie =
  "uuid=d7983115-362c-478c-85ef-544eb0a5d801; device=08522850c92cfbef77d9427d1458ba4f; sdcard_id_v2=d60d7940-7279-448e-accf-b7066467990b; dauth=eyJhbGciOiJIUzI1NiJ9.eyJpc0dyb3VwQWNjb3VudCI6ZmFsc2UsInJlc291cmNlRnJvbSI6MSwiaXNzIjoiY29ycC5pbWRhZGEuY24iLCJhZG1pbiI6ZmFsc2UsImRlcHQiOm51bGwsInVhIjoiVFc5NmFXeHNZUzgxTGpBZ0tFMWhZMmx1ZEc5emFEc2dTVzUwWld3Z1RXRmpJRTlUSUZnZ01UQmZNVFZmTnlrZ1FYQndiR1ZYWldKTGFYUXZOVE0zTGpNMklDaExTRlJOVEN3Z2JHbHJaU0JIWldOcmJ5a2dRMmh5YjIxbEx6azJMakF1TkRZMk5DNHhNVEFnVTJGbVlYSnBMelV6Tnk0ek5nPT0iLCJ1dWlkIjoiZDc5ODMxMTUtMzYyYy00NzhjLTg1ZWYtNTQ0ZWIwYTVkODAxIiwic2VjdXJpdHlMZXZlbCI6MywibG9naW5UaW1lIjoxNjQwMjQwMDM3MjQ4LCJwaG9uZSI6IjE4MzUxOTI1OTEyIiwiY2hpbmVzZU5hbWUiOiI2SkdqNXBpTzVwaU8iLCJleHAiOjE2NDAyODk2MDEsImlhdCI6MTY0MDI0MDAzNywiZW1haWwiOiJkb25nbWluZ21pbmdAaW1kYWRhLmNuIiwianRpIjoiZG9uZ21pbmdtaW5nIiwidXNlcm5hbWUiOiJkb25nbWluZ21pbmcifQ.4DM2f6T37C-YM4ClJIX5RPnSaRVDIfyilbexzfJ3IPc";
const params = {
  params: {
    index: "rum-data-*",
    body: {
      version: true,
      size: 500,
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
          must: [
            {
              query_string: {
                query:
                  "data.location.hostname:portal.imdada.cn AND data.http_initiator:(spa OR spa_hard) ",
                analyze_wildcard: true,
                time_zone: "Asia/Shanghai",
              },
            },
          ],
          filter: [
            {
              match_phrase: {
                "data.pgu": "https://portal.imdada.cn/app/#/select",
              },
            },
            { range: { "data.t_done": { gte: 60000, lt: null } } },
            {
              range: {
                timestamp: {
                  gte: "2021-12-21T16:00:00.000Z",
                  lte: "2021-12-22T16:00:00.000Z",
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
    preference: 1640250954803,
    timeout: "30000ms",
  },
};

console.log("===params");

const getLoadingTime = async (url: string) => {
  console.log("======getLoadingTime");
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
      // fields: { timestamp },
      _source: {
        timestamp,
        data: {
          t_done,
          t_resp,
          http_initiator,
          location: { hash },
          user_agent: {
            browser: { family: browserFamily },
            device: { family: deviceFamily, type: deviceType },
            os: { family: osFamily },
            raw,
          },
        },
        memo: { restiming },
        beacon_id,
      },
    } = item;

    restiming = restiming
      ? ResourceTimingDecompression.decompressResources(JSON.parse(restiming))
      : [];

    // ===============人工调度台接口处理
    // const list = [
    //   "https://portal.imdada.cn/dcOperation/dispatch/order/counts",
    //   "https://portal.imdada.cn/dcOperation/dispatch/order/list",
    // ];

    // const apiTimeArr = restiming
    //   ?.filter((item: any) => {
    //     return list.includes(item.name);
    //   })
    //   ?.map((item: any) => {
    //     return Number(item.duration);
    //   });

    // const maxTime = !apiTimeArr.length
    //   ? "jump"
    //   : apiTimeArr.length === 2
    //   ? Math.max(...apiTimeArr)
    //   : beacon_id;

    // console.log("======res", maxTime);

    // console.log(restiming.filter((item: any) => list.includes(item.name)));

    let list = restiming.reduce((init: any, ele: any, index: any, arr: any) => {
      const { name, startTime, duration } = ele;
      init.push({ name, startTime, duration });
      return init;
    }, []);
    list.sort((a: any, b: any) => a.startTime - b.startTime);

    list = list.reduce((init: any, ele: any, index: any, arr: any) => {
      const { name, duration } = ele;
      init[name] = duration;
      return init;
    }, {});

    return [
      timestamp[0],
      beacon_id,
      hash,
      http_initiator,
      t_done,
      t_resp,
      deviceFamily,
      deviceType,
      osFamily,
      browserFamily,
      raw,
      JSON.stringify(list),
    ];
    // console.log(
    //   "======timestamp",
    //   timestamp,
    //   new Date(timestamp).toLocaleString()
    // );
    // return {
    //   time: new Date(timestamp).toLocaleString(),
    //   beacon_id,
    //   hash,
    //   http_initiator,
    //   t_done,
    //   t_resp,
    //   deviceFamily,
    //   deviceType,
    //   osFamily,
    //   browserFamily,
    //   raw,
    //   restming: JSON.stringify(list),
    // };
  });

  const buffer: any = xlsx.build([
    {
      name: "worksheets",
      data: [
        [
          "timestamp",
          "beacon_id",
          "hash",
          "http_initiator",
          "t_done",
          "t_resp",
          "deviceFamily",
          "deviceType",
          "osFamily",
          "browserFamily",
          "raw",
          "rest",
        ],
        ...data,
      ],
    },
  ]);
  fs.writeFileSync(path.resolve(`./hongliu/select.xlsx`), buffer, {
    flag: "w",
  });

  // let str = JSON.stringify(data, null, "\t");
  // fs.writeFile("./sea/01-99th-1201.json", str, function(err) {
  //   if (err) {
  //     console.error(err);
  //   }
  //   console.log("写入成功!");
  // });
};

getLoadingTime("https://kibana-rum.corp.imdada.cn/internal/search/es");

export default getLoadingTime;
