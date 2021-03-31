import plan from "@ddn/flightplan";

function useServer(userConfig) {
  const { application, deployTo, server, sharedDirectory } = userConfig;
  const targetPath = deployTo + application;

  // 目前仅支持 nginx
  if (server && server.name === "nginx") {
    console.log('server: ', server);

    // todo: 修改为直接提交, 确保 configFile 是其存放位置
    plan.local(local => {
      local.log("Upload the server config ...");
      // local.with("cd config/deploy", () => {
      //   local.transfer(
      //     server.configFile,
      //     targetPath + "/" + sharedDirectory
      //   );
      // });
      if (server.configFile) {
        local.transfer(server.configFile.url, targetPath + "/" + sharedDirectory);
      }
    });

    plan.remote(remote => {
      remote.log("Link the config");
      // 这个是危险操作，建议确认之后再操作
      // remote.exec("sudo rm -f /etc/nginx/sites-enabled/default");
      const sharedConfig = `${targetPath}/${sharedDirectory}/${server.configFile.url}`;
      const nginxConfig = `/etc/nginx/sites-enabled/${server.configFile.name}`;

      // 判断链接是否存在，存在先删除
      // 参考：https://www.jb51.net/article/186273.htm
      remote.exec(`if [[ -L ${nginxConfig} ]]; then sudo rm -f ${nginxConfig}; fi`);

      // 建立软连接
      remote.exec(
        `if [[ ! -L ${nginxConfig} ]]; then sudo ln -s ${sharedConfig} ${nginxConfig}; fi`
      );

      // 重启服务 remote.exec("sudo service nginx restart") 该命令不可用;
      remote.exec("sudo /etc/init.d/nginx restart");
    });
  }
}

export default useServer;
