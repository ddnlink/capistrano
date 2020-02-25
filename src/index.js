"use strict";

import yargs from "yargs";

function Main() {
  const argv = yargs
    .usage("Usage: deploy [command]")
    .example("deploy prod", "deploy prod to the remote server")
    .help("h")
    .alias("h", "help")
    .epilog("copyright 2020")
    .argv;

    // console.log("argv._ = ", argv._);
  const commands = argv._;
  const command = commands[0];

  switch (command) {
    // 初始化部署
    case "install":
    
    // 部署 DDN 区块链节点
    case "blockchain":

    // 部署 DDN 区块链浏览器
    case "explorer":
    
    // 将部署回滚到前一个正常运行版本
    case "rollback":
      require(`./tasks/${command}`).default(yargs);
      break;

    // 部署类似 egg.js 后台应用程序
    case "prod":
      require(`./tasks/backend`).default(yargs);
      break;
    default:
      console.log("Please select a command: install, prod, blockchain ...");
      break;
  }
}

Main();