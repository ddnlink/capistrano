/**
 * flightplan.js
 *
 * Please login your servers firstly before run the follow commands, for example:
 *
 * ```
 * ssh -i /path/to/your.pem root@47.92.77.135
 * ```
 *
 * 使用方法
 * 请严格按照下面的步骤执行
 * 1、单台部署
 * 使用  plan.target([ips[0]])
 * 运行 `npm run `
 */
"use strict";

import plan from "flightplan";
import { defaultConfig } from "../default.config";
import initPath from "../plans/initPath";
import current from "../plans/current";
import clone from "../plans/clone";
import useServer from "../plans/useServer";
import sftp from "../plans/sftp";

// 这里兼容命令行工具，一个参数的时候就是命令行工具
function DeployWebsite(config) {
  console.log('defaultConfig: ', defaultConfig);
  const userConfig = { ...defaultConfig, ...config };
  console.log('userConfig: ', userConfig);

  makePlan(userConfig); // stage == 'website'
  plan.run("default", "website"); // todo: 这里不能使用 stage 变量
}

function makePlan(userConfig) {
  const stage = "website";
  // const options = userConfig[stage];

  // 请先在服务器端建立该目录
  plan.target(stage, userConfig.target);

  // 远程 前端处理
  initPath(userConfig);

  // 上传Nginx配置到服务器
  useServer(userConfig);
  
  if (userConfig.scm === "sftp") {
    // 直接将本地 build 的静态内容打包上传到 current
    sftp(userConfig);
  } else {
    clone(userConfig);
    current(userConfig);
  }
}

export default DeployWebsite;
