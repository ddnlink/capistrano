"use strict";
import plan from "@ddn/flightplan";
import moment from "moment";

function clone(config) {
  const {
    application,
    deployTo,
    scm,
    repoUrl,
    branch,
    releasesDirectory,
    keepReleases,
    currentDirectory
  } = config;

  const targetPath = deployTo + application;
  const currentPath = targetPath + "/" + currentDirectory;

  plan.remote(remote => {
    remote.verbose()
    const repoPath = targetPath + "/repo";

    // 克隆或pull代码
    remote.with(`cd ${repoPath}`, () => {
      remote.log("git clone or pull the code...");

      const packageJson = `${repoPath}/package.json`;

      if (scm === "git") {
        remote.exec(
          `if [ ! -f ${packageJson} ]; then git clone -b ${branch} ${repoUrl} . ; else git pull origin ${branch}; fi`
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

      // 停止服务，因为接下来 current 文件夹将被变更
      remote.with(`cd ${currentPath}`, () => {
        /**
         * 保证node版本兼容性，这里应该放在系统初始化部分
         * 
         * 下面的脚本如果无法执行，说明用户的服务器 .bashrc 的配置需要修改以便交互，请参考下面的链接
         * https://dhampik.com/blog/nodejs-deploy-nvm
         */
        remote.exec('nvm use default');
        remote.exec('yarn stop');
      });

      // 断开当前文件夹与前一版本的连接，然后建立对当前版本的软连接
      remote.exec(
        "rm -rf " +
          currentDirectory +
          " && ln -s " +
          currentRepoPath +
          " " +
          currentDirectory
      );
    });
  });
}

export default clone;
