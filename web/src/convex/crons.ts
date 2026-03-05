import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';

const crons = cronJobs();

crons.daily('clean unused storage items', {hourUTC: 0, minuteUTC: 0}, internal.storage.cleanup);

export default crons;
