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

import moment from "moment";
import plan from "flightplan";
import config from "../config";
import initPath from "./initPath";
import useServer from "./useServer";
import current from './current';

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

console.log('stage= ', stage);

  makePlan("prod", stage);

  plan.run("prod", "prod");
}

function makePlan(name, stage) {
  const {
    application,
    scm,
    deployTo,
    repoUrl,
    branch,
    releasesDirectory,
    keepReleases,
    currentDirectory
  } = userConfig;

  // console.log(config.userConfig);

  const options = userConfig[stage];

  const targetPath = deployTo + application;
  const currentPath = targetPath + "/" + currentDirectory;

  // 请先在服务器端建立该目录
  plan.target(name, options.target);

  // 远程 前端处理
  initPath(name, userConfig);

  // 上传配置到服务器
  plan.local(name, local => {
    local.log('上传配置文件')
    local.transfer('config/config.prod.js', targetPath + "/" + userConfig.sharedDirectory); // 保存后为： shared/config/config.prod.js 
  })

  // 上传Nginx配置到服务器
  useServer(name, userConfig);

  plan.remote(name, remote => {
    const repoPath = targetPath + "/repo";

    // 克隆或pull代码
    remote.with(`cd ${repoPath}`, () => {
      remote.log("git clone or pull the code...");

      const packageJson = `${repoPath}/package.json`;

      if (scm === "git") {
        remote.exec(
          `if [ ! -f ${packageJson} ]; then git clone -b ${branch} ${repoUrl} . ; else git pull; fi`
        );
      }

      remote.log("git clone or pull success!");
    });

    // 拷贝新代码
    remote.with(`cd ${targetPath}`, () => {
      const revisonsLog = `${targetPath}/revisions.log`;

      const currentRepoDirectory = moment()
        .format("YYYYMMdhmmss")
        .toString();

      const currentRepoPath = releasesDirectory + "/" + currentRepoDirectory;
      remote.exec(`cp -r repo ${currentRepoPath}`);

      remote.exec(`echo ${currentRepoDirectory} >> ${revisonsLog};`);

      // 获取第一行并写入文件：first=$(head -n +1 ${revisonsLog}); echo $first > current.log;
      remote.exec(
        `count=$(wc -l < ${revisonsLog}); if [ $count -gt ${keepReleases} ]; then sed -i '1d' ${revisonsLog}; fi`
      );

      // 第一次部署没有 current 文件夹，无法 cd；以后有了之后，必须在重新连接前把服务关闭
      // remote.exec(`if [ -d ${currentDirectory} ]; then cd ${currentDirectory} && yarn stop; fi`);
      
      // 断开当前文件夹与前一版本的连接，然后建立对当前版本的软连接
      remote.exec(
        "rm -f " +
          currentDirectory +
          " && ln -s " +
          currentRepoPath +
          " " +
          currentDirectory
      );
    });
  });

  current(name, userConfig);
}

export default backend;
