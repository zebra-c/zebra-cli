const axios = require('axios');
const Inquirer = require('inquirer');
const { wrapFetchAddLoding } = require('./utils');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
let ncp = require('ncp');
const MetalSmith = require('metalsmith');
let { render } = require('consolidate').ejs;
let downLoadGit = require('download-git-repo');
render = promisify(render);
downLoadGit = promisify(downLoadGit);
ncp = promisify(ncp);

const { name, DOWN_NAME, PROMPTS_NAME, SCAN_FILE } = require('./utils/constants');
const fetchRepoList = async () => {
  const { data } = await axios.get(`https://api.github.com/orgs/${name}/repos`);
  return data;
};

const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/${name}/${repo}/tags`);
  return data;
};
 
const download = async (repo, tag) => {
  let api = `${name}/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  const dest = `${DOWN_NAME}/${repo}`; 
  await downLoadGit(api, dest);
  return dest;
};

module.exports = async (projectName) => {
  let repos = await wrapFetchAddLoding(fetchRepoList, 'fetching repo list')();
  repos = repos.map((item) => item.name);
  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: '请选择项目名称',
    choices: repos,
  });

  let tags = await wrapFetchAddLoding(fetchTagList, 'fetching tag list')(repo);
  tags = tags.map((item) => item.name);
  let tag = ''
  if (tags.length > 0) {
    const { tag: _tag } = await Inquirer.prompt({
      name: 'tag',
      type: 'list',
      message: '请选择该项目 tag',
      choices: tags,
    });
    tag = _tag;
  }
  let target = await wrapFetchAddLoding(download, 'download template')(repo, tag);
  
  if (!fs.existsSync(path.join(target, PROMPTS_NAME))) {
    await ncp(target, path.join(path.resolve(), projectName));
  } else {
    await new Promise((resovle, reject) => {
      MetalSmith(__dirname)
        .source(target)
        .destination(path.join(path.resolve(), projectName))
        .use(async (files, metal, done) => {
          const result = await Inquirer.prompt(require(path.join(target, PROMPTS_NAME)));
          const data = metal.metadata();
          Object.assign(data, result);
          delete files[PROMPTS_NAME];
          done();
        })
        .use((files, metal, done) => {
          Reflect.ownKeys(files).forEach(async (file) => {
            let content = files[file].contents.toString();
            if (SCAN_FILE.includes(file)) {
              if (content.includes('<%')) {
                content = await render(content, metal.metadata());
                files[file].contents = Buffer.from(content);
              }
            }
          });
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
    };
};