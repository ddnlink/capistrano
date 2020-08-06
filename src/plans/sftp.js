import plan from "flightplan";

function sftp(config) {
  const { application, deployTo, currentDirectory, buildCMD } = config;
  const targetPath = deployTo + application;
  const currentPath = targetPath + "/" + currentDirectory;

  plan.remote(remote => {
    // 初始化路径
    remote.with(`cd ${targetPath}`, () => {
      remote.exec("mkdir -p " + currentDirectory);
    });
  });

  plan.local(local => {
    // local.exec("rm -rf ./dist.tar.gz");

    if (buildCMD) {
      local.exec(`${buildCMD}`);
    }

    // todo: 默认路径是 dist ，也可能是 build，应该可以定制；打包的名称也应该可以定制
    local.exec("tar zcf dist.tar.gz ./dist");

    // TODO: 上传的文档名称及其路径，也该可以定制
    local.transfer("dist.tar.gz", currentPath);
    // local.transfer("2.0.2/ddn-linux-2.0.2-mainnet.tar.gz", currentPath);
  });

  plan.remote(remote => {
    remote.with(`cd ${currentPath}`, () => {
      remote.exec(`tar zxvf dist.tar.gz .`);
      remote.exec(`rm dist.tar.gz`)
    });
  });
}

export default sftp;
