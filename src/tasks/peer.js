/**
 * 本代码是节点部署脚本
 *
 * 使用方法：
 *
 * ```
 * $ deploy peer
 * ```
 */
"use strict";

import path from "path";
import plan, { runtime } from "@ddn/flightplan";
import config from "../config";
import initPath from "../plans/initPath";
import useServer from "../plans/useServer";
import upload from "../plans/upload";
import uploadPeer from "../plans/upload-peer";

const userConfig = config.userConfig;

function deployment(yargs) {
  const argv = yargs
    .reset()
    .option("e", {
      alias: "env",
      description: "init the env`s remote server",
    })
    .help("h")
    .alias("h", "help").argv;

  const commands = argv._;

  makePlan(commands);
  run(commands);
}

function makePlan(commands) {
  const stage = commands[0];
  const isPrepare = commands[1] && commands[1] === "prepare";
  console.log("isPrepare", isPrepare);

  const {
    application,
    uploadFileName,
    deployTo,
    releasesDirectory,
    keepReleases,
    currentDirectory,
    sharedDirectory,
  } = userConfig;

  const options = userConfig[stage];

  const targetPath = path.join(deployTo, application);
  const currentPath = path.join(targetPath, currentDirectory);
  const releasesPath = path.join(targetPath, releasesDirectory);
  const sharedPath = path.join(targetPath, sharedDirectory);

  // 请先在服务器端建立该目录
  plan.target(stage, options.target);

  // 远程 前端处理
  initPath(userConfig);

  // 上传 peer 安装包
  uploadPeer(userConfig);

  if (isPrepare) {
    // 上传配置文件
    upload(userConfig);

    // 上传Nginx配置到服务器
    useServer(userConfig);
  }

  // 与 current 有少许差别
  plan.remote((remote) => {
    // 拷贝新代码
    remote.with(`cd ${targetPath}`, () => {
      // 断开当前文件夹与前一版本的连接，然后建立对当前版本的软连接（先要停止服务）
      if (!isPrepare) {
        remote.log("DDN stopping...");
        remote.with(`cd ${currentDirectory}`, () => {
          remote.exec("./ddnd stop");
          remote.log("DDN stoped!");
        });
      }

      remote.log("Tar and create system link to current...");
      remote.with(`cd ${releasesPath}`, () => {
        const file = uploadFileName + userConfig.extendName;
        remote.exec(`tar zxf ${file}`); // 如果想显示解压文件，加上 v 参数
      });

      const currentRepoPath = path.join(releasesPath, uploadFileName);

      remote.exec(
        "rm -rf " +
          currentDirectory +
          " && ln -s " +
          currentRepoPath +
          " " +
          currentDirectory
      );
    });

    // current 安装并处理链接
    remote.with(`cd ${currentPath}`, () => {
      remote.log("link shared folders and files...");
      // 链接文件夹，有些文件夹不需要连接，比如：打包好的节点中 node_modules 是不能共享的，应该排除软连接保护
      for (const dir of userConfig.linkedDirs) {
        remote.exec(
          `mkdir -p ${sharedPath}/${dir}`
        ); // 文件夹不存在，链接成功也没用

        remote.exec(`rm -rf ${dir}`); // 最新链接的肯定不存在
        remote.exec(
          `ln -s ${sharedPath}/${dir} ./`
        );
      }

      // 上传生产环境的配置。第一次初始化的时候，或者需要修改的时候，就提供 prepare 命令，上传或更新最新配置文件
      if (isPrepare) {
        remote.with(`cd ${sharedPath}`, () => {
          if (remote.runtime.config) {
            remote.exec(`rm -f .ddnrc.js`);
    
            // 解压文件
            remote.exec(
              `tar zxvf configures.tar.gz .`
            );
            remote.log(`copying ${remote.runtime.config}`);
            remote.exec(`mkdir -p ./config`);
            remote.exec(`cp ./configures/${remote.runtime.config} ./config/.ddnrc.js`);
    
            // 清理
            remote.log("删除配置文件");
            remote.exec(`rm -rf configures`);
            remote.exec(
              `rm configures.tar.gz`
            );
          }
        })
      }

      // 链接生产环境的配置，记得通过上面的命令，先进行上传
      for (const file of userConfig.linkedFiles) {
        remote.exec(`rm -f ${file}`);
        remote.exec(
          // 这里使用连接程序会出错 `ln -s ${sharedPath}/config/${file} ./`
          `cp ${sharedPath}/config/${file} ./`
        );
      }
    });
  });

  // 构建、启动、停止等操作
  plan.remote((remote) => {
    // /current 安装并处理链接
    remote.with(`cd ${currentPath}`, () => {
      // 初始化配置。注5：这里使用sudo命令，兼容localnet，本地需要使用命令行密码。
      if (isPrepare) {
      // remote.sudo("chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure", {
      //   user: "root",
      //   silent: true,
      //   failsafe: true,
      // });
      }
      // 启动命令
      // remote.exec("./ddnd start");
    });
  });
}

function run(commands) {
  plan.run("default", commands[0]);
}

export default deployment;
