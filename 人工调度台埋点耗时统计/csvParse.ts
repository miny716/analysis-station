import xlsx from "node-xlsx";
import { percentFun, traverseArr } from "./utils/params";

const fs = require("fs");
const path = require("path");

const date = "20220322";
// const device = ["pc", "app", "mobileBrowser"];
const device = ["pc", "app"];

let statisticsData = {
  name: "统计数据",
  data: [
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
  ],
};

for (let deviceIndex = 0; deviceIndex < device.length; deviceIndex++) {
  var list = xlsx.parse(
    `人工调度台埋点耗时统计/results/${date}/调度台埋点数据-${date}-${device[deviceIndex]}.xlsx`
  );

  // 一般读取到的数据为[{"name":"Sheet1","data":[["name","age"],["miny",15],["dong",16]]}]格式

  var data = [...list[0].data];
  // 二维数组转置,并去除time列，每个元数组[key, "1,2", null, 3,......]
  var newData = traverseArr(data)
    .slice(1)
    .map((item: any, index: any) => {
      const keyArr = []; // key  [1, 2, 3,......]
      let sum = 0;
      let littleOneSum = 0;
      for (let index = 1; index < item.length; index++) {
        const trackTime = item[index];
        if (trackTime !== "-" && !!trackTime) {
          const trackTimeVal = `${trackTime}`.split("|").map((val: any) => {
            sum += +val;
            if (+val < 1000) {
              littleOneSum++;
            }
            return +val;
          });
          keyArr.push(...trackTimeVal);
        }
      }
      // ["访问设备", "埋点Key", "样本数", "平均值", "75值", "85值", "95值"]
      const statisticItem = [
        device[deviceIndex],
        item[0],
        keyArr.length,
        sum / keyArr.length,
        percentFun(keyArr, 75),
        percentFun(keyArr, 85),
        percentFun(keyArr, 95),
        littleOneSum,
        littleOneSum / keyArr.length,
      ];
      // statisticsData[0].data.push(...statisticItem);
      statisticsData = {
        ...statisticsData,
        data: [...statisticsData.data, statisticItem],
      };
      return [item[0], ...keyArr]; // [key, 1, 2, 3,......]
    });
  let excelData = []; // {name,data}
  // 不同设备不同埋点的原数据
  for (let i = 0; i < newData.length; i++) {
    const element = newData[i];
    excelData.push({
      name: element[0].split(".")[1],
      data: element.map((item: any) => [item]),
    });
  }
  // 表格列数据
  const bufferTrack: any = xlsx.build(excelData);
  // 生成表格
  fs.writeFileSync(
    path.resolve(
      `人工调度台埋点耗时统计/results/${date}/统计-${date}-${device[deviceIndex]}.xlsx`
    ),
    bufferTrack,
    {
      flag: "w",
    }
  );
}
console.log("======over1111====one");

// 统计所有设备平均值，75-85-95
// 表格列数据
const buffer: any = xlsx.build([statisticsData]);
fs.writeFileSync(
  path.resolve(`人工调度台埋点耗时统计/results/${date}/统计总-${date}.xlsx`),
  buffer,
  {
    flag: "w",
  }
);
