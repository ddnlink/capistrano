import plan from "flightplan";

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
      const nginxConfig = `${targetPath}/${sharedDirectory}/${server.configFile.name}`;
      remote.exec(
        `if [ ! -f /etc/nginx/sites-enabled/${server.configFile.name} ]; then sudo ln -s ${nginxConfig} /etc/nginx/sites-enabled/${server.configFile.name}; fi`
      );
      // remote.exec("sudo service nginx restart");
      remote.exec("sudo /etc/init.d/nginx restart");
    });
  }
}

export default useServer;
