const axios = require("axios");
const Inquirer = require("inquirer");
const chalk = require("chalk");
const execa = require("execa");
const fsExtra = require("fs-extra");
const { wrapFetchAddLoding } = require("./utils");
const path = require("path");
const { promisify } = require("util");
let ncp = require("ncp");
const MetalSmith = require("metalsmith");
let { render } = require("consolidate").ejs;
render = promisify(render);
ncp = promisify(ncp);

const {
  name,
  git,
  DOWN_NAME,
  PROMPTS_NAME,
  SCAN_FILE,
  TOKEN,
} = require("./utils/constants");
const log = console.log;

const fetchRepoList = async () => {
  const { data } = await axios.get(
    `http://${git}/api/v4/groups/${name}/projects`,
    {
      headers: {
        "PRIVATE-TOKEN": TOKEN,
      },
    }
  );
  return data;
};

const download = async (repo) => {
  const originTempFilePath = path.resolve(DOWN_NAME, repo);
  const existFile = await fsExtra.pathExists(originTempFilePath);
  if (existFile) {
    fsExtra.removeSync(originTempFilePath);
  }
  try {
    execa.commandSync(
      `git clone git@${git}:${name}/${repo}.git ${originTempFilePath}`
    );
    return originTempFilePath;
  } catch (e) {
    log(chalk.red(e));
    return false;
  }
};

module.exports = async (projectName) => {
  if (!projectName) {
    log(chalk.red("请输入项目名称， 如 zebra-cli create your-project"));
    return false;
  }
  const current = path.join(path.resolve(), projectName);
  if (!TOKEN) {
    console.log(
      chalk.red("\n你需要先初始化 git token\n"),
      chalk.yellow("zebra-cli config [你的token]")
    );
    return false;
  }
  if (fsExtra.pathExistsSync(current)) {
    const { del } = await Inquirer.prompt({
      name: "del",
      type: "confirm",
      message: `${projectName} 在当前目录中已存在, 请确认是否删除`,
    });
    if (!del) {
      return;
    }
    fsExtra.removeSync(current);
  }

  let repos = await wrapFetchAddLoding(fetchRepoList, "fetching repo list")();
  repos = repos.map((item) => item.name);
  const { repo } = await Inquirer.prompt({
    name: "repo",
    type: "list",
    message: "请选择项目名称",
    choices: repos,
  });

  let target = await wrapFetchAddLoding(download, "download template")(repo);
  if (!target) {
    log(chalk.red("未成功 git clone"));
    return;
  }

  if (!fsExtra.pathExistsSync(path.join(target, PROMPTS_NAME))) {
    await ncp(target, current);
  } else {
    await new Promise((resovle, reject) => {
      MetalSmith(__dirname)
        .source(target)
        .destination(current)
        .use(async (files, metal, done) => {
          const result = await Inquirer.prompt(
            require(path.join(target, PROMPTS_NAME))
          );
          const data = metal.metadata();
          Object.assign(data, result);
          delete files[PROMPTS_NAME];
          done();
        })
        .use((files, metal, done) => {
          Reflect.ownKeys(files).forEach(async (file) => {
            const ext = path.extname(file);
            if (SCAN_FILE.includes(file) || SCAN_FILE.includes(ext)) {
              let content = files[file].contents.toString();
              if (content.includes("<%")) {
                content = await render(content, metal.metadata());
                files[file].contents = Buffer.from(content);
              }
            }
          });
          log(chalk.green("***************** 👋创建成功 ***************"));
          done();
        })
        .build((err) => {
          if (!err) {
            resovle();
          } else {
            reject();
          }
        });
    });
  }
  const folder = path.join(process.cwd(), "./", projectName, ".git");
  execa.commandSync(`rm -rf ${folder}`);
};
