use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::PathBuf;

use crate::{CreateSopItem, CreateTodoItem, SopItem, TodoItem};

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

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS todo_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sop_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (sop_id) REFERENCES sop_items(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Add sort_order column if not exists (for migration)
        let _ = self.conn.execute(
            "ALTER TABLE todo_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            [],
        );

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

    pub fn create_todo_item(&self, item: &CreateTodoItem) -> SqliteResult<TodoItem> {
        let now = chrono::Utc::now().to_rfc3339();

        // Get the max sort_order for this sop_id
        let max_order: i64 = self.conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM todo_items WHERE sop_id = ?1",
                [item.sop_id],
                |row| row.get(0),
            )
            .unwrap_or(-1);

        let sort_order = max_order + 1;

        self.conn.execute(
            "INSERT INTO todo_items (sop_id, content, completed, sort_order, created_at, updated_at) VALUES (?1, ?2, 0, ?3, ?4, ?5)",
            (&item.sop_id, &item.content, &sort_order, &now, &now),
        )?;

        let id = self.conn.last_insert_rowid();
        Ok(TodoItem {
            id,
            sop_id: item.sop_id,
            content: item.content.clone(),
            completed: false,
            sort_order,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_todo_items(&self, sop_id: i64) -> SqliteResult<Vec<TodoItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, sop_id, content, completed, sort_order, created_at, updated_at FROM todo_items WHERE sop_id = ?1 ORDER BY sort_order ASC"
        )?;

        let items = stmt.query_map([sop_id], |row| {
            Ok(TodoItem {
                id: row.get(0)?,
                sop_id: row.get(1)?,
                content: row.get(2)?,
                completed: row.get::<_, i32>(3)? != 0,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        items.collect()
    }

    pub fn toggle_todo_item(&self, id: i64) -> SqliteResult<TodoItem> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE todo_items SET completed = NOT completed, updated_at = ?1 WHERE id = ?2",
            (&now, &id),
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, sop_id, content, completed, sort_order, created_at, updated_at FROM todo_items WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(TodoItem {
                id: row.get(0)?,
                sop_id: row.get(1)?,
                content: row.get(2)?,
                completed: row.get::<_, i32>(3)? != 0,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
    }

    pub fn delete_todo_item(&self, id: i64) -> SqliteResult<()> {
        self.conn.execute("DELETE FROM todo_items WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn update_todo_item(&self, id: i64, content: &str) -> SqliteResult<TodoItem> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE todo_items SET content = ?1, updated_at = ?2 WHERE id = ?3",
            (content, &now, &id),
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, sop_id, content, completed, sort_order, created_at, updated_at FROM todo_items WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(TodoItem {
                id: row.get(0)?,
                sop_id: row.get(1)?,
                content: row.get(2)?,
                completed: row.get::<_, i32>(3)? != 0,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
    }

    pub fn reorder_todo_items(&self, item_ids: &[i64]) -> SqliteResult<()> {
        let now = chrono::Utc::now().to_rfc3339();
        for (index, id) in item_ids.iter().enumerate() {
            self.conn.execute(
                "UPDATE todo_items SET sort_order = ?1, updated_at = ?2 WHERE id = ?3",
                (index as i64, &now, id),
            )?;
        }
        Ok(())
    }
}
