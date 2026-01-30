import { LoggerFactory } from './LoggerFactory';
import { APP_NAME } from '../../constants';
import chalk from 'chalk';

const Logger = LoggerFactory.configure({
    id: chalk.green(APP_NAME),
    level: 'all'
});

export { Logger };
