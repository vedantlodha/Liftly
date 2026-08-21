// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_empty_jackpot.sql';
import m0001 from './0001_public_leper_queen.sql';
import m0002 from './0002_dazzling_baron_strucker.sql';
import m0003 from './0003_smooth_layla_miller.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  