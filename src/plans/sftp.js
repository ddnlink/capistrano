import plan from "flightplan";

function sftp(config) {
  const { application, deployTo, currentDirectory } = config;
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

    local.exec("yarn build");
    local.exec("tar zcf dist.tar.gz ./dist");
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
