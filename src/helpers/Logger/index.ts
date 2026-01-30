import { LoggerFactory } from './LoggerFactory';
import chalk from 'chalk';

const Logger = LoggerFactory.configure({
    id: chalk.green('TALLY'),
    level: 'all'
});

export { Logger };
