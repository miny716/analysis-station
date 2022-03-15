/**
 * 注意：size最大值为10000
 */
export const getParams = (
  searchQuery: string,
  startTime: string,
  endTime: string
) => {
  return {
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
                  query: searchQuery,
                  analyze_wildcard: true,
                  time_zone: "Asia/Shanghai",
                },
              },
            ],
            filter: [
              {
                range: {
                  timestamp: {
                    gte: startTime,
                    lte: endTime,
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
      preference: 1646980827922,
      timeout: "30000ms",
    },
  };
};

export const setParams = (cookie: string) => ({
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

// 计算平均值
export const avergeFun = (arr: any) => {
  if (!arr.length) return null;
  return (
    arr.reduce((acc: any, ele: any) => {
      return acc + ele;
    }, 0) / arr.length
  );
};

// 排序(正序)
export const sortFun = (arr: any) => {
  function compare(x: any, y: any) {
    // x:[222]格式
    if (+x > +y) {
      return 1;
    } else if (+x < +y) {
      return -1;
    } else {
      return 0;
    }
  }
  return arr.sort(compare);
};

// 分位数计算
export const percentFun = (sortArr: any, numth: any = 75) => {
  const L = sortArr.length;
  if (!L) return null;
  return +sortArr[Math.floor((L / 100) * numth)];
};
