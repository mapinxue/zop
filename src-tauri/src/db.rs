use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::PathBuf;

use crate::{CreateSopItem, SopItem};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> SqliteResult<Self> {
        let db_path = Self::get_db_path()?;
        let conn = Connection::open(&db_path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn get_db_path() -> SqliteResult<PathBuf> {
        let home_dir = dirs::home_dir().expect("Could not find home directory");
        let zop_dir = home_dir.join(".zop");

        if !zop_dir.exists() {
            fs::create_dir_all(&zop_dir).expect("Could not create .zop directory");
        }

        Ok(zop_dir.join("zop.db"))
    }

    fn init_tables(&self) -> SqliteResult<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sop_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                item_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    pub fn create_sop_item(&self, item: &CreateSopItem) -> SqliteResult<SopItem> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO sop_items (name, icon, item_type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            (&item.name, &item.icon, &item.item_type, &now, &now),
        )?;

        let id = self.conn.last_insert_rowid();
        Ok(SopItem {
            id,
            name: item.name.clone(),
            icon: item.icon.clone(),
            item_type: item.item_type.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_all_sop_items(&self) -> SqliteResult<Vec<SopItem>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, icon, item_type, created_at, updated_at FROM sop_items ORDER BY created_at DESC")?;

        let items = stmt.query_map([], |row| {
            Ok(SopItem {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                item_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        items.collect()
    }

    pub fn delete_sop_item(&self, id: i64) -> SqliteResult<()> {
        self.conn
            .execute("DELETE FROM sop_items WHERE id = ?1", [id])?;
        Ok(())
    }
}
