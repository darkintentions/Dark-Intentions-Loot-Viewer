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
  equiploc TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player, item, boss, response, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_player ON loot(player);
CREATE INDEX IF NOT EXISTS idx_date ON loot(date);
CREATE INDEX IF NOT EXISTS idx_boss ON loot(boss);
