fetch("https://kibana-rum.corp.imdada.cn/internal/search/es", {
  headers: {
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
  },
  referrer: "https://kibana-rum.corp.imdada.cn/app/discover",
  referrerPolicy: "strict-origin-when-cross-origin",
  body:
    '{"params":{"index":"rum-data-*","body":{"version":true,"size":500,"sort":[{"timestamp":{"order":"desc","unmapped_type":"boolean"}}],"aggs":{"2":{"date_histogram":{"field":"timestamp","calendar_interval":"1h","time_zone":"Asia/Shanghai","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"timestamp","format":"date_time"}],"_source":{"excludes":[]},"query":{"bool":{"must":[{"query_string":{"query":"data.location.hostname:portal.imdada.cn AND data.http_initiator:(spa OR spa_hard) AND NOT _exists_:data.rt_quit","analyze_wildcard":true,"time_zone":"Asia/Shanghai"}}],"filter":[{"match_phrase":{"data.location.hash":"/system/resident/station"}},{"range":{"timestamp":{"gte":"2021-10-20T16:00:00.000Z","lte":"2021-10-24T16:00:00.000Z","format":"strict_date_optional_time"}}}],"should":[],"must_not":[]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}},"rest_total_hits_as_int":true,"ignore_unavailable":true,"ignore_throttled":true,"preference":1635094592368,"timeout":"30000ms"}}',
  method: "POST",
  mode: "cors",
  credentials: "include",
});
