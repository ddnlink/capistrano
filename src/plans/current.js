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
      // FIXME: 链接文件夹
      for (const dir of config.linkedDirs) {
        remote.exec(`mkdir -p ${targetPath}/${config.sharedDirectory}/${dir}`); // 被连接的文件夹不存在，链接成功也没用
        remote.exec(`rm -rf ${dir}`); //最新链接的肯定不存在
        remote.exec(`ln -s ${targetPath}/${config.sharedDirectory}/${dir} ./`);
      }
      // 链接生产环境的配置，记得先要上传
      for (const file of config.linkedFiles) {
        remote.exec(`rm -f config/${file}`);
        remote.exec(
          `ln -s ${targetPath}/${config.sharedDirectory}/config/${file} ./config/`
        );
      }
      remote.log("yarn install...");
      remote.exec("yarn install --ignore-engines");

      remote.log("If deploy explorer, please build it...");
      remote.exec('yarn build');
      
      // 迁移
      remote.log("If deploy prod, please migrate it...");
      // remote.exec('NODE_ENV=production yarn run init');

      // 重启服务
      // remote.exec('yarn stop');
      // remote.exec('yarn start');
    });
  });
}

export default current;
