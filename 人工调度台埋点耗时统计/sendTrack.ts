import xlsx from "node-xlsx";
import { percentFun } from "./utils/params";

const fs = require("fs");
const path = require("path");

const pre = "周-";
// const pre = "";

const dateTime = "03290401";

/**
 * @param tableData 单个表格数据
 */
function analysisTable(tableData: any, device: string) {
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
        device,
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
        "访问设备",
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
  fs.writeFileSync(
    path.resolve(
      `人工调度台埋点耗时统计/大数据埋点/${dateTime}/统计总${dateTime}-${device}.xlsx`
    ),
    buffer,
    {
      flag: "w",
    }
  );
}

// 导出数据源
var appCsv = xlsx.parse(
  `人工调度台埋点耗时统计/大数据埋点/${dateTime}/${pre}调度台用户操作耗时埋点APP_2022${dateTime}.csv`
)[0].data;
var notAppCsv = xlsx.parse(
  `人工调度台埋点耗时统计/大数据埋点/${dateTime}/${pre}调度台用户操作耗时埋点非APP_2022${dateTime}.csv`
)[0].data;

analysisTable(appCsv, "app");
analysisTable(notAppCsv, "pc");

console.log("======sendTrack=======over=====");
