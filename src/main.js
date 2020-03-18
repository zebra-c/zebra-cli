const program = require('commander');
const path = require('path')
const { version } = require('./utils/constants');

const actionsMap = {
  create: {
    description: 'create project',
    alias: 'cr',
    examples: [
      'zebra-cli create <template-name>',
    ],
  },
  config: {
    description: 'config info',
    alias: 'c',
    examples: [
      'zebra-cli config get <k>',
      'zebra-cli config set <k> <v>',
    ],
  },
  '*': {
    description: 'command not found',
  },
};

Object.keys(actionsMap).forEach((action) => {
  program
    .command(action)
    .alias(actionsMap[action].alias)
    .description(actionsMap[action].description)
    .action(() => {
      if (action === '*') {
        console.log(acitonMap[action].description);
      } else {
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

program.on('--help', () => {
  console.log('Examples:');
  Object.keys(actionsMap).forEach((action) => {
    (actionsMap[action].examples || []).forEach((example) => {
      console.log(`  ${example}`);
    });
  });
});

program.version(version)
  .parse(process.argv); // process.argv就是用户在命令行中传入的参数