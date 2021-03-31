"use strict";

import plan from "@ddn/flightplan";
import config from "../config";
import current from '../plans/current';

const userConfig = config.userConfig;

/**
 * 流程：
 * 1. 从revisions.txt里找到上一个版本的文件夹 release-old ，；
 * 2. 进入 current 目录，停止服务；
 * 3. 删除 current 目录，将 release-old 链接为 current;
 * 4. 进入 current 目录，开启服务；
 *
 * @param {*} yargs
 */
function rollback(yargs) {
  const argv = yargs
    .reset()
    .option("m", {
      alias: "message",
      description: "provide any sentence"
    })
    .help("h")
    .alias("h", "help").argv;

  console.log(argv._);

  const command = argv._[0]; // command, stage
  const stage = argv._[1]; // command, stage

  makePlan(stage);

  plan.run("default", stage);
}

function makePlan(stage) {
  const {
    application,
    deployTo,
    releasesDirectory,
    keepReleases,
    currentDirectory
  } = userConfig;
  const options = userConfig[stage];

  const targetPath = deployTo + application;
  // const currentPath = targetPath + "/" + currentDirectory;

  // 请先在服务器端建立该目录
  plan.target(stage, options.target);

  plan.remote(remote => {
    // 获取前一个版本库
    remote.with(`cd ${targetPath}`, () => {
      const revisonsLog = `${targetPath}/revisions.log`;

      // 获取倒数第二个版本库名称，删除当前链接，然后重新链接
      remote.exec(
        `preRepo=$(tail -2 ${revisonsLog} | head -n 1) && rm -f ${currentDirectory} && ln -s ${releasesDirectory}/$preRepo ${currentDirectory}`
      );

      // 删除最后一个版本记录（无法再回滚回去了）
      remote.exec(`sed -i '$d' ${revisonsLog}`);

      // todo: 删除最后一个版本库文件？
    });
  });

  current(userConfig);
}

export default rollback;
