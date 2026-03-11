-- Loot tracker table
CREATE TABLE IF NOT EXISTS loot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL,
  item TEXT NOT NULL,
  boss TEXT,
  response TEXT,
  date TEXT,
  armor_type TEXT,
  gear_slot TEXT,
  class TEXT,
  instance TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player, item, boss, response, date)
);

-- Player roster with EP/GP tracking
CREATE TABLE IF NOT EXISTS roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL UNIQUE,
  ep REAL DEFAULT 0,
  gp REAL DEFAULT 2,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Effort Points (EP) history
CREATE TABLE IF NOT EXISTS ep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL,
  ep REAL NOT NULL,
  reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gear Points (GP) history
CREATE TABLE IF NOT EXISTS gp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL,
  gp REAL NOT NULL,
  reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gear slot point values
CREATE TABLE IF NOT EXISTS gear_slot_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gear_slot TEXT NOT NULL UNIQUE,
  points REAL DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_player ON loot(player);
CREATE INDEX IF NOT EXISTS idx_date ON loot(date);
CREATE INDEX IF NOT EXISTS idx_boss ON loot(boss);
CREATE INDEX IF NOT EXISTS idx_roster_player ON roster(player);
CREATE INDEX IF NOT EXISTS idx_ep_player ON ep(player);
CREATE INDEX IF NOT EXISTS idx_gp_player ON gp(player);
