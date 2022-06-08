import xlsx from "node-xlsx";
import { percentFun } from "./utils/params";

const fs = require("fs");
const path = require("path");

/**
 * @param tableData 单个表格数据
 */
function analysisTable(tableData: any, downLoadUrl: string) {
  var clickParList = [];
  // tableData第一行：["click_par","channel","app_name","page_name","user_id"]
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    const [click_par, ...tail] = row;
    clickParList.push(JSON.parse(click_par));
  }

  // 生成{key1:{
  //  data:[], sum:0; littleOneCount:0
  // }; key2:{}}
  const trackTimesMap = clickParList.reduce((acc, cur) => {
    const curKey = Object.keys(cur)[0];
    const curVal = +cur[curKey];
    if (!acc[curKey]) {
      acc[curKey] = {
        data: [],
        sum: 0,
        littleOneCount: 0,
      };
    }

    const { data, sum, littleOneCount } = acc[curKey];
    acc[curKey] = {
      data: [...data, curVal],
      sum: sum + curVal,
      littleOneCount: curVal < 1000 ? littleOneCount + 1 : littleOneCount,
    };
    return acc;
  }, {});

  const statisticData = Object.keys(trackTimesMap).reduce(
    (acc: any, curKey: any) => {
      const { data, sum, littleOneCount } = trackTimesMap[curKey];
      const keydataLength = data.length;
      const statisticKey = [
        curKey,
        keydataLength,
        sum / keydataLength,
        percentFun(data, 75),
        percentFun(data, 85),
        percentFun(data, 95),
        littleOneCount,
        littleOneCount / keydataLength,
      ];
      acc.push(statisticKey);
      return acc;
    },
    [
      [
        // "访问设备",
        "埋点Key",
        "样本数",
        "平均值",
        "75值",
        "85值",
        "95值",
        "1s内数量",
        "1s内占比",
      ],
    ]
  );
  const buffer: any = xlsx.build([
    {
      name: "统计数据",
      data: statisticData,
    },
  ]);
  fs.writeFileSync(path.resolve(downLoadUrl), buffer, {
    flag: "w",
  });
}

const dateTime = "06040610";
// // 1、portalScreenTrace 周
// let portalScreenTrace = xlsx.parse(
//   `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalScreenTrace-调度台用户操作耗时埋点${dateTime}.csv`
// )[0].data;
// let portalScreenTraceUrl = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalScreenTrace-调度台用户操作耗时埋点${dateTime}.xlsx`;
// analysisTable(portalScreenTrace, portalScreenTraceUrl);

// 2、portalWayBillClickTrace 每天
for (let i = 4; i <= 7; i++) {
  const dateEle = i < 10 ? `060${i}` : `06${i}`;
  let appCsv = xlsx.parse(
    `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalWayBillClickTrace-调度台用户操作耗时埋点${dateEle}.csv`
  )[0].data;

  let url = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalWayBillClickTrace-调度台用户操作耗时埋点${dateEle}.xlsx`;
  analysisTable(appCsv, url);
}
// for (let i = 1; i <= 3; i++) {
//   const dateEle = i < 10 ? `060${i}` : `06${i}`;
//   let appCsv = xlsx.parse(
//     `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalWayBillClickTrace-调度台用户操作耗时埋点${dateEle}.csv`
//   )[0].data;

//   let url = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalWayBillClickTrace-调度台用户操作耗时埋点${dateEle}.xlsx`;
//   analysisTable(appCsv, url);
// }

// 3、portalMakeAssignTrace-调度台用户操作耗时埋点
const firstDate = "06040607";

let portalMakeAssignTrace = xlsx.parse(
  `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalMakeAssignTrace-调度台用户操作耗时埋点${firstDate}.csv`
)[0].data;
let portalMakeAssignTraceUrl = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalMakeAssignTrace-调度台用户操作耗时埋点${firstDate}.xlsx`;
analysisTable(portalMakeAssignTrace, portalMakeAssignTraceUrl);
// ======
// // const secondDate = "05250527";

// // let portalMakeAssignTrace1 = xlsx.parse(
// //   `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalMakeAssignTrace-调度台用户操作耗时埋点${secondDate}.csv`
// // )[0].data;
// // let portalMakeAssignTraceUrl1 = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalMakeAssignTrace-调度台用户操作耗时埋点${secondDate}.xlsx`;
// // analysisTable(portalMakeAssignTrace1, portalMakeAssignTraceUrl1);

// 4、portalTableListTrace-调度台用户操作耗时埋点
const oneday = "0607";
let portalTableListTrace = xlsx.parse(
  `人工调度台埋点耗时统计/大数据埋点/${dateTime}/portalTableListTrace-调度台用户操作耗时埋点${oneday}.csv`
)[0].data;
let portalTableListTraceUrl = `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计-portalTableListTrace-调度台用户操作耗时埋点${oneday}.xlsx`;
analysisTable(portalTableListTrace, portalTableListTraceUrl);

console.log("======sendTrack=======over=====");
