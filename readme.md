Capistranojs powered by node.js
-------------------------------

Developing...

参考 ruby 的 capistrano, 开发中。。。

## Feathers 特点

。。。

## Install 安装

```
$ yarn global add @ddn/capistrano
```

## Use 使用

部署分为两个步骤：

### 1. 安装本地

```
$ deploy init
```

在本地工程目录，生成如下配置文件（建议将下面的`deploy`文件夹，特别是其中的`pem`文件夹及其文件，放在`.gitignore`里）

    project
        |___ config 没有就建立；
            |___deploy 没有就建立
                    |____ config.js 配置文件
                    |____ pem 服务器登录私钥
           

### 2. 部署任务

```
$ deploy prod
```

该命令将初始化服务端环境：

    project
        |___current 当前工作目录，通过软连接指向 versions最新版本目录；
        |___versions 各个旧的版本工作目录，方便回滚
        |___shared 数据持久化目录，方便备份和数据安全
                |____ config.* 各种配置文件，可能包含敏感信息
                |____ tmp 缓存文件
                |____ logs 日志文件
                |____ database 数据库文件


执行结果如下：

```
$ deploy prod

✈ Running prod:prod
✈ Connecting to '47.*.*.21'
[ 'prod' ]
✈ Executing remote task on 47.*.*.21
47.*.*.21 Remote start...
47.*.*.21 $ mkdir -p /var/www/datm-server
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && mkdir -p shareded
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && mkdir -p releases
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && mkdir -p tmp
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && mkdir -p repo
47.*.*.21 ● ok
✈ Remote task on 47.*.*.21 finished after 3.31 s
✈ Executing local task
localhost 上传配置文件
localhost $ rsync --files-from /var/folders/2b/8f4h42vj46g0qnm89v08p9kw0000gn/T/2217801c90c0121dc0cc25d96c6ff6cb -az --rsh="ssh -p22 -i /Users/imfly/Documents/projects/DDN/datm-server/config/deploy/pem/datm.ddn.link.pem" ./ root@47.*.*.21:/var/www/datm-server/shareded
localhost ● ok
✈ Local task finished after 1.5 s
✈ Executing remote task on 47.*.*.21
47.*.*.21 git clone or pull the code...
47.*.*.21 $ cd /var/www/datm-server/repo && if [ ! -f /var/www/datm-server/repo/package.json ]; then git clone git@git.ebookchain.net:datm/datm-server.git . ; else git pull; fi
47.*.*.21 > Already up-to-date.
47.*.*.21 > 
47.*.*.21 ● ok
47.*.*.21 git clone or pull success!
47.*.*.21 $ cd /var/www/datm-server && cp -r repo releases/202002010158
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && echo 202002010158 >> /var/www/datm-server/revisions.log;
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && count=$(wc -l < /var/www/datm-server/revisions.log); if [ $count -gt 5 ]; then sed -i '1d' /var/www/datm-server/revisions.log; fi
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server && rm -f current && ln -s releases/202002010158 current
47.*.*.21 ● ok
47.*.*.21 yarn stopping...
47.*.*.21 link shared folders and files...
47.*.*.21 $ cd /var/www/datm-server/current && rm -f config/config.prod.js
47.*.*.21 ● ok
47.*.*.21 $ cd /var/www/datm-server/current && ln -s shareded/config.prod.js config/config.prod.js
47.*.*.21 ● ok
47.*.*.21 yarn install...
47.*.*.21 $ cd /var/www/datm-server/current && yarn
47.*.*.21 > yarn install v1.19.1
47.*.*.21 > [1/5] Validating package.json...
47.*.*.21 > [2/5] Resolving packages...
47.*.*.21 > [3/5] Fetching packages...
47.*.*.21 > info fsevents@1.2.9: The platform "linux" is incompatible with this module.
47.*.*.21 > info "fsevents@1.2.9" is an optional dependency and failed compatibility check. Excluding it from installation.
47.*.*.21 > [4/5] Linking dependencies...
47.*.*.21 > warning "egg-oss > ali-oss > co-defer@1.0.0" has unmet peer dependency "co@4".
47.*.*.21 > warning "egg-bin > co-mocha@1.2.2" has incorrect peer dependency "mocha@>=1.18 <6".
47.*.*.21 > warning "egg-bin > espower-typescript@9.0.1" has unmet peer dependency "typescript@>= 2.4.2".
47.*.*.21 > warning "eslint-config-egg > @typescript-eslint/eslint-plugin > tsutils@3.17.1" has unmet peer dependency "typescript@>=2.8.0 || >= 3.2.0-dev || >= 3.3.0-dev || >= 3.4.0-dev || >= 3.5.0-dev || >= 3.6.0-dev || >= 3.6.0-beta || >= 3.7.0-dev || >= 3.7.0-beta".
47.*.*.21 > [5/5] Building fresh packages...
47.*.*.21 > Done in 26.52s.
47.*.*.21 > 
47.*.*.21 ● ok
47.*.*.21 yarn migrate...
47.*.*.21 yarn stating...
47.*.*.21 Done, Success!
✈ Remote task on 47.*.*.21 finished after 33 s
✈ Flightplan finished after 38 s
```

## FAQ

1. 首先保证本地可以登录远程服务器；
   
```
$ ssh -i path-to-pem root@your-id
```

2. 确保远程可以正常 fork 代码
   
```远程
$ git clone repo_url 
```

如果无法克隆，按照下列步骤操作

```
$ ssh -T git@github.com
# git@github.com: Permission denied (publickey).
```

产生 ssh-key

```
$ ssh-keygen -t rsa -b 4096 -C 'your@email.com'
$ cat ~/.ssh/id_rsa.pub
```

将产生的 公钥 拷贝到 版本库 -> deploy key 里

3. `bash: yarn: command not found` 错误

该错误是使用 nvm 安装的原因，只要下面两步

```
$ npm config set prefix /usr/local
$ npm i -g yarn
```

4. `/usr/bin/env: ‘node’: No such file or directory`

这也是 nvm 安装，导致没有命令行交互时出现的错误

```
$ which node
$ ln -s /root/.nvm/versions/node/v10.19.0/bin/node /usr/bin
```

## LICENSE

MIT 

Author: imfly <kubying@qq.com>