"use strict";

import yargs from "yargs";

function Main() {
  const argv = yargs
    .usage("Usage: deploy [command]")
    .example("deploy prod", "deploy prod to the remote server")
    .help("h")
    .alias("h", "help")
    .epilog("copyright 2020-" + Date.now())
    .argv;

    // console.log("argv._ = ", argv._);
  const commands = argv._;
  const command = commands[0];

  switch (command) {
    // 初始化部署
    case "install":
    
    // 使用源码部署 DDN 区块链节点
    case "blockchain":

    // 使用打包好的文件
    case "peer":

    // 部署 DDN 区块链浏览器、DDN 文档等静态网站，需要在配置里 提供 本地构建命令
    case "website":
    
    // 将部署回滚到前一个正常运行版本
    case "rollback":

    // 部署类似 egg.js 后台应用程序
    case "backend":
      require(`./tasks/${command}`).default(yargs);
      break;

    default:
      console.log("Please select a command: install, backend, blockchain, website ...");
      break;
  }
}

Main();