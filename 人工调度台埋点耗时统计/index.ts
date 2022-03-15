import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";
import getLoadingTime from "./dispatchAllTime";
import { avergeFun, sortFun, percentFun } from "./utils/params";
// 数据分析：PC:DEVICE.PC + Mobile浏览器:DEVICE.MOBILE
const trackDispatch = [
  "_portal_tableListTrace",
  "_portal_makeAssignTrace",
  "_portal_screenTrace",
  "_portal_wayBillClickTrace",

  "_portal_tableListTrace_map",
  "_portal_makeAssignTrace_map",
  "_portal_screenTrace_map",
  "_portal_wayBillClickTrace_map",
];

// 数据分析：APP:DEVICE.APP
const trackDispatchH5 = [
  "_portal_tableListTrace_h5",
  "_portal_makeAssignTrace_h5",
  "_portal_screenTrace_h5",
  "_portal_wayBillClickTrace_h5",
];

const DEVICE = {
  PC: " AND data.user_agent.device.type: Desktop",
  APP: " AND data.user_agent.raw: *dada-portal*",
  MOBILE:
    " AND data.user_agent.device.type: Mobile NOT data.user_agent.raw: *dada-portal*",
};

// 修改

const cookie =
  "uuid=d7983115-362c-478c-85ef-544eb0a5d801; device=08522850c92cfbef77d9427d1458ba4f; sdcard_id_v2=d60d7940-7279-448e-accf-b7066467990b; dauth=eyJhbGciOiJIUzI1NiJ9.eyJpc0dyb3VwQWNjb3VudCI6ZmFsc2UsInJlc291cmNlRnJvbSI6MSwiaXNzIjoiY29ycC5pbWRhZGEuY24iLCJhZG1pbiI6ZmFsc2UsImRlcHQiOm51bGwsInVhIjoiVFc5NmFXeHNZUzgxTGpBZ0tFMWhZMmx1ZEc5emFEc2dTVzUwWld3Z1RXRmpJRTlUSUZnZ01UQmZNVFZmTnlrZ1FYQndiR1ZYWldKTGFYUXZOVE0zTGpNMklDaExTRlJOVEN3Z2JHbHJaU0JIWldOcmJ5a2dRMmh5YjIxbEx6azVMakF1TkRnME5DNDFNU0JUWVdaaGNta3ZOVE0zTGpNMiIsInV1aWQiOiJkNzk4MzExNS0zNjJjLTQ3OGMtODVlZi01NDRlYjBhNWQ4MDEiLCJzZWN1cml0eUxldmVsIjoxLCJsb2dpblRpbWUiOjE2NDczMjgwOTI0MjcsInBob25lIjoiMTgzNTE5MjU5MTIiLCJjaGluZXNlTmFtZSI6IjZKR2o1cGlPNXBpTyIsImV4cCI6MTY0NzM3NDQwMSwiaWF0IjoxNjQ3MzI4MDkyLCJlbWFpbCI6ImRvbmdtaW5nbWluZ0BpbWRhZGEuY24iLCJqdGkiOiJkb25nbWluZ21pbmciLCJ1c2VybmFtZSI6ImRvbmdtaW5nbWluZyJ9.iaKJMYHdfLeU_fxStaZ-0OQOZ80hvdSxz0hr4Hs_v9s";
const timeOneDay = 86400000,
  startDate = "03-15",
  endDate = "03-15";

const startTime = `2022-${startDate} 00:00:00`,
  endTime = `2022-${endDate} 16:30:00`;
const perfixQuery = `data.location.hostname:portal.imdada.cn AND data.http_initiator:(spa OR spa_hard) AND NOT _exists_:data.rt_quit AND _exists_: memo.`;

// 统计几天内，一个埋点的数据
const getOneTrack = async (trackKey: string, device: string) => {
  // 上报埋点 + 设备
  let query = perfixQuery + trackKey + DEVICE[device];

  const startValue = new Date(startTime).valueOf(),
    endValue = new Date(endTime).valueOf();

  // 统计天数
  const diffDays = (endValue - startValue) / timeOneDay;
  let PromiseArr: any = [];

  if (diffDays > 1) {
    const daysArr = Array.from({ length: diffDays }).map(
      (item, index) => index
    );
    daysArr.map((item: number) => {
      let start = startValue + timeOneDay * item,
        end = startValue + timeOneDay * (item + 1);

      PromiseArr.push(
        getLoadingTime(
          query,
          new Date(start).toISOString(), //格林威治时间
          new Date(end).toISOString(),
          cookie
        )
      );
    });
  } else {
    PromiseArr.push(
      getLoadingTime(
        query,
        new Date(startValue).toISOString(), //格林威治时间
        new Date(endValue).toISOString(),
        cookie
      )
    );
  }

  // 合并每天的数据
  let mergeData: any = [];
  await Promise.all(PromiseArr)
    .then((result) => {
      if (result?.length > 0) {
        result.map((item: any) => {
          mergeData.push(...item);
        });
      }
    })
    .catch((error) => {
      console.log("========PromiseError===============", error);
    });

  // 处理数据
  let res: any = [],
    sum = 0;

  mergeData.forEach((item: any) => {
    let {
      _source: {
        memo: { [trackKey]: trackValue }, // 解构出变量值
      },
    } = item;
    trackValue.split(",").forEach((ele: any) => {
      sum += +ele;
      res.push([+ele]);
    });
  }, []);

  let average = null,
    seventhFive = null,
    eighthFive = null,
    ninthFive = null;
  if (res.length > 0) {
    average = sum / res.length;

    let sortArr = sortFun(res);
    seventhFive = percentFun(sortArr, 75);
    eighthFive = percentFun(sortArr, 85);
    ninthFive = percentFun(sortArr, 95);
  }

  return {
    name: trackKey,
    data: [
      [
        trackKey,

        "average",
        average,
        "seventhFive",
        seventhFive,
        "eighthFive",
        eighthFive,
        "ninthFive",
        ninthFive,
      ],
      ...res,
    ],
  };
};

const generateXlsx = (sheetsData: any, device: string) => {
  // 表格列数据
  const buffer: any = xlsx.build(sheetsData);
  // 生成表格
  fs.writeFileSync(
    path.resolve(
      `人工调度台埋点耗时统计/results/newData/${startDate}~${endDate}${device}.xlsx`
    ),
    buffer,
    {
      flag: "w",
    }
  );
};

const getAllData = async () => {
  let sheetsDataAPP: any = [];
  let sheetsDataPC: any = [];
  let sheetsDataMOBILE: any = [];

  // APP
  const promisesheetsDataAPP = trackDispatchH5.map(async (trackKey) => {
    return await getOneTrack(trackKey, "APP");
  });
  sheetsDataAPP = await Promise.all(promisesheetsDataAPP);
  generateXlsx(sheetsDataAPP, "APP");

  // PC
  const promisesheetsDataPC = trackDispatch.map(async (trackKey) => {
    return await getOneTrack(trackKey, "PC");
  });
  sheetsDataPC = await Promise.all(promisesheetsDataPC);
  generateXlsx(sheetsDataPC, "PC");

  // MOBILE-浏览器
  const promisesheetsDataMOBILE = trackDispatch.map(async (trackKey) => {
    return await getOneTrack(trackKey, "MOBILE");
  });
  sheetsDataMOBILE = await Promise.all(promisesheetsDataMOBILE);
  generateXlsx(sheetsDataMOBILE, "MOBILE");
};

getAllData();
