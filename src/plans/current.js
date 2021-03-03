"use strict";
import plan from "flightplan";

function current(config) {
  const { application, deployTo, currentDirectory } = config;

  const targetPath = deployTo + application;
  const currentPath = targetPath + "/" + currentDirectory;

  plan.remote(remote => {
    remote.log("Remote current ...");

    // /current 安装并处理链接
    remote.with(`cd ${currentPath}`, () => {
      remote.log("link shared folders and files...");

      // 链接共享文件夹，特别是 database 文件，必须放在共享文件夹里
      let linkedDirs = config.linkedDirs
      if (linkedDirs) {
        // 保证是数组格式
        if (typeof config.linkedDirs === 'string') {
          linkedDirs = linkedDirs.split(',');
        }
        
        for (const dir of linkedDirs) {
          remote.exec(`mkdir -p ${targetPath}/${config.sharedDirectory}/${dir}`); // 被连接的文件夹不存在，链接成功也没用
          remote.exec(`rm -rf ${dir}`); //最新链接的肯定不存在
          remote.exec(`ln -s ${targetPath}/${config.sharedDirectory}/${dir} ./`);
        }
      }
      
      // 链接生产环境的配置文件，记得先要上传
      let linkedFiles = config.linkedFiles;
      if (linkedFiles) {
        // 保证是数组格式
        if (typeof linkedFiles === 'string') {
          linkedFiles = linkedFiles.split(',');
        }

        for (const file of linkedFiles) {
          remote.exec(`rm -f config/${file}`);
          remote.exec(
            `ln -s ${targetPath}/${config.sharedDirectory}/config/${file} ./config/`
          );
        }
      }
      
      // 数据库文件，通常是 sqlite 的文件（仅是名称，不需要具体文件），DDN 节点使用到
      const dbFile = config.databaseFile;
      // file 默认放在 database 文件夹下
      if (dbFile) {
        // 通常情况下，在新的 current 文件夹里，文件不存在，而是第一次运行时，手动转移到 database 目录下了
        remote.exec(`rm -f database/${dbFile}`); 
        remote.exec(
          `ln -s ${targetPath}/${config.sharedDirectory}/database/${dbFile} ./database/`
        );
      }
      remote.log("yarn install...");
      remote.exec("yarn install --ignore-engines");

      // 执行用户配置命令
      remote.log("If deploy prod, please migrate it...");
      remote.exec('NODE_ENV=production yarn migrate'); // TODO

      // 重启服务
      remote.exec('yarn start');
    });
  });
}

export default current;
