/**
 * flightplan.js
 *
 * Please login your servers firstly before run the follow commands, for example:
 *
 * ```
 * ssh -i /path/to/your.pem root@yourIp
 * ```
 *
 * 使用方法
 * 请严格按照下面的步骤执行
 * 1、单台部署
 * 使用  plan.target([ips[0]])
 * 运行 `npm run `
 */
"use strict";

import moment from "moment";
import plan from "flightplan";
import config from "../config";
import initPath from "../plans/initPath";
import useServer from "../plans/useServer";
import upload from "../plans/upload";

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

  makePlan(stage);

  plan.run("default", "blockchain");
}

function makePlan(stage) {
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

  console.log('application', application);

  const options = userConfig[stage];

  const targetPath = deployTo + application;
  const currentPath = targetPath + "/" + currentDirectory;

  // 请先在服务器端建立该目录
  plan.target(stage, options.target);

  // 远程 前端处理
  initPath(userConfig);

  // 上传配置文件
  upload(userConfig);

  // 上传Nginx配置到服务器
  useServer(userConfig);

  // 与 current 有少许差别
  plan.remote(remote => {
    const repoPath = targetPath + "/repo";

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

      // 断开当前文件夹与前一版本的连接，然后建立对当前版本的软连接（先要停止服务）
      remote.log("ddnd stopping...");
      remote.with(`cd ${currentPath}`, () => {
        remote.exec("./ddnd stop");
      })

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

      remote.log("link shared folders and files...");
      // FIXME: 链接文件夹
      for (const dir of userConfig.linkedDirs) {
        remote.exec(
          `mkdir -p ${targetPath}/${userConfig.sharedDirectory}/${dir}`
        ); // 文件夹不存在，链接成功也没用

        remote.exec(`rm -rf ${dir}`); //最新链接的肯定不存在
        remote.exec(
          `ln -s ${targetPath}/${userConfig.sharedDirectory}/${dir} ./`
        );
      }

      // 链接生产环境的配置，记得先要上传
      for (const file of userConfig.linkedFiles) {
        remote.exec(`rm -f config/${file}`);
        remote.exec(
          `ln -s ${targetPath}/${userConfig.sharedDirectory}/config/${file} ./config/`
        );
      }

      // 上传特定服务的配置
      if (remote.runtime.config) {
        remote.exec(`rm -f .ddnrc.js`);

        // 解压文件
        remote.exec(`tar zxvf ${targetPath}/${userConfig.sharedDirectory}/configures.tar.gz .`)
        remote.log(`cp ${remote.runtime.config}`)
        remote.exec(`cp ./configures/${remote.runtime.config} ./.ddnrc.js`)

        // 清理
        remote.log('删除配置文件')
        remote.exec(`rm -rf ./configures`)
        remote.exec(`rm ${targetPath}/${userConfig.sharedDirectory}/configures.tar.gz`)
      }

      remote.log("yarn install...");
      remote.exec("yarn --registry https://registry.npmjs.org/");

      // 如果是静态文件，就可以构建一下
      // remote.log("yarn build...");
      // remote.exec("yarn build");
    });
  });

  // 构建、启动、停止等操作
  plan.remote(remote => {
    // /current 安装并处理链接
    remote.with(`cd ${currentPath}`, () => {
      // 初始化配置。注5：这里使用sudo命令，兼容localnet，本地需要使用命令行密码。
      remote.sudo("chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure", {
        user: "root",
        silent: true,
        failsafe: true
      });

      // 启动命令
      // remote.exec("./ddnd stop");

      remote.exec("./ddnd start");
    });
  });
}

export default deployment;
