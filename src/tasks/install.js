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
 * 使用  plan.target(name, [ips[0]])
 * 运行 `npm run `
 */
"use strict";

import shell from "shelljs";
import path from "path";

function install(yargs) {
  const argv = yargs
    .reset()
    .option("e", {
      alias: "env",
      description: "init the env`s remote server"
    })
    .help("h")
    .alias("h", "help").argv;

  // console.log(stage);

  makePlan();
}

function makePlan() {
  const targetPath = process.cwd();
  const currentPath = targetPath + "/" + "config/deploy";

  const template = path.resolve(__dirname, "../template/config");
  const configFile = currentPath + "/config.js";
  // console.log("template= ", template);
  
  // 上传配置到服务器
  console.log("Upload ...");
  shell.mkdir("-p", currentPath); // ./config/config.prod.js
  shell.mkdir("-p", currentPath + "/pem"); // path to pems
  shell.cd(currentPath);

  // shell.exec(`cp ${template} ${configFile}`);
  shell.exec(`if [ ! -f ${configFile} ]; then cp ${template} ${configFile}; fi`);
  console.log("Install finished!");
}

export default install;
