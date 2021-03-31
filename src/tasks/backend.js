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

import plan from "@ddn/flightplan";
import config from "../config";
import initPath from "../plans/initPath";
import current from "../plans/current";
import clone from "../plans/clone";
import useServer from "../plans/useServer";

const userConfig = config.userConfig;

function backend(yargs) {
  const argv = yargs
    .reset()
    .option("e", {
      alias: "env",
      description: "init the env`s remote server"
    })
    .help("h")
    .alias("h", "help").argv;

  const stage = argv._;

  makePlan(stage);

  plan.run("default", "prod");
}

function makePlan(stage) {
  const { application, deployTo } = userConfig;

  const options = userConfig[stage];
  const targetPath = deployTo + application;

  // 请先在服务器端建立该目录
  plan.target(stage, options.target);

  // 远程 前端处理
  initPath(userConfig);

  // 上传配置到服务器
  plan.local(local => {
    local.log("上传配置文件");
    local.transfer(
      "config/config.prod.js",
      targetPath + "/" + userConfig.sharedDirectory
    ); // 保存后为： shared/config/config.prod.js
  });

  // 上传Nginx配置到服务器
  useServer(userConfig);

  clone(userConfig);

  current(userConfig);
}

export default backend;
