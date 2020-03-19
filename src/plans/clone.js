"use strict";
import plan from "flightplan";
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

  plan.remote(remote => {
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
}

export default clone;
