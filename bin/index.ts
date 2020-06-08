#!/usr/bin/env node

import * as Promise from 'bluebird';

function onError (e: Error) {
  console.log('uncaught error', e.stack);
}

Promise.onPossiblyUnhandledRejection(onError)
process.on('uncaughtException', onError);

import program = require('commander');
import { InterfaceGlobal, InterfaceCLI } from '../lib/interface';

// Extend global with our program opts
let g = <InterfaceGlobal>(global as unknown);
g.program = program;

import poll from '../lib/command-poll';
import list from '../lib/command-list';
import monitor from '../lib/command-monitor';

console.log('\n🚔  OBD CLI 🚘');

program
  .version(require('../package.json').version)
  .option('-c, --connection <string>', 'type of connection, valid options are "fake" or "serial"')
  .option('-b, --baudrate <number>', 'control connection baudrate, e.g 38400')
  .option('-o, --outdir <string>', 'loation to create folder containing monitor results')
  .option('-z, --zip', 'if this option is passed then output files will be zipped')
  .option(
    '-i, --interface <name>',
    'the interface to use for connection, e.g /dev/tty.serialusb'
  );

program
  .command('list')
  .description('list supported pids that can be passed to "poll" commands')
  .action(list);

program
  .command('poll <pid> [pids...]')
  .description('poll for an OBD value(s) specified by <pid> or a list of pids')
  .action(function (pid:string, extraPids:string[]) {
    if (!pid) {
      console.log('please specify at least 1 pid, e.g "obd poll -c fake 2F')
      process.exit(1);
    }

    poll([pid].concat(extraPids || []));
  });

program
  .command('monitor <pid:interval> [pid:interval...]')
  .description(
    `similar to poll, but continously checks PID values every n milliseconds,
    e.g 0C:1000 will get RPM every 1000 milliseconds`
  )
  .action(function (pid:string, extraPids:string[]) {
    if (!pid) {
      console.log('please specify at least 1 pid, e.g "obd poll -c fake 2F')
      process.exit(1);
    }

    monitor([pid].concat(extraPids || []));
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
