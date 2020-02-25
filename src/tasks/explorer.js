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

const userConfig = config.userConfig;

function deployment(yargs) {
  const argv = yargs
    .reset()
    .option("e", {
      alias: "env",
      description: "init the env`s remote server"
    })
    .help("h")
    .alias("h", "help").argv;

  const stage = argv._;

  makePlan("explorer", stage);

  plan.run("explorer", "explorer");
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
  if (userConfig.server && userConfig.server.name === "nginx") {
    plan.local(name, local => {
      local.log("上传服务器配置文件");
      local.with("cd config/deploy", () => {
        
        local.transfer(
          userConfig.server.configFile,
          targetPath + "/" + userConfig.sharedDirectory
        );
      });
    });

    plan.remote(name, remote => {
      remote.log("链接配置文件");

      // 不用删除默认，将其修改即可
      // remote.exec("rm -f /etc/nginx/sites-enabled/default");
      const nginxConfig = `${targetPath}/${userConfig.sharedDirectory}/${userConfig.server.configFile}`;
      remote.exec(
        `if [ ! -f ${nginxConfig} ]; then ln -s ${nginxConfig} /etc/nginx/sites-enabled/${userConfig.server.configFile}; fi`
      );
      remote.exec("sudo service nginx restart");
    });
  }

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
      const revisonsPath = `${targetPath}/revisions.log`;

      const currentRepo = moment()
        .format("YYYYMMdhmmss")
        .toString();

      const currentRepoPath = releasesDirectory + "/" + currentRepo;
      remote.exec(`cp -r repo ${currentRepoPath}`);

      remote.exec(`echo ${currentRepo} >> ${revisonsPath};`);

      // 获取第一行并写入文件：first=$(head -n +1 ${revisonsPath}); echo $first > current.log;
      remote.exec(
        `count=$(wc -l < ${revisonsPath}); if [ $count -gt ${keepReleases} ]; then sed -i '1d' ${revisonsPath}; fi`
      );

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

    // /current 安装并处理链接
    remote.with(`cd ${currentPath}`, () => {
      remote.log("yarn stopping...");
      // remote.exec("yarn stop");

      remote.log("link shared folders and files...");
      // FIXME: 链接文件夹
      for (const dir of userConfig.linkedDirs) {
        // remote.exec(`rm -rf ${dir}`); //最新链接的肯定不存在
        remote.exec(`mkdir -p ${dir}`); // 文件夹不存在，链接成功也没用
        remote.exec(`ln -s ${targetPath}/${userConfig.sharedDirectory}/${dir} ./${dir}`);
      }

      // 链接生产环境的配置，记得先要上传
      for (const file of userConfig.linkedFiles) {
        remote.exec(`rm -f config/${file}`);
        remote.exec(
          `ln -s ${targetPath}/${userConfig.sharedDirectory}/config/${file} ./config/${file}`
        );
      }

      remote.log("yarn install...");
      remote.exec("yarn");

      remote.log("yarn build...");
      remote.exec('yarn build');

      // remote.log("yarn stating...");
      // remote.exec('yarn start');
    });

    remote.log("Done, Success!");
  });
}

export default deployment;
