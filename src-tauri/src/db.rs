use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::PathBuf;

use crate::{CreateSopItem, CreateTodoItem, FlowData, SopItem, TodoItem, AiConfig, SaveAiConfig};

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
                updated_at TEXT NOT NULL,
                deleted_at TEXT
            )",
            [],
        )?;

        // Add deleted_at column if not exists (for migration)
        let _ = self.conn.execute(
            "ALTER TABLE sop_items ADD COLUMN deleted_at TEXT",
            [],
        );

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

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS flow_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sop_id INTEGER NOT NULL UNIQUE,
                nodes TEXT NOT NULL,
                edges TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (sop_id) REFERENCES sop_items(id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS ai_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                model_name TEXT NOT NULL,
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
            "INSERT INTO sop_items (name, icon, item_type, created_at, updated_at, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
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
            deleted_at: None,
        })
    }

    pub fn get_all_sop_items(&self) -> SqliteResult<Vec<SopItem>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, icon, item_type, created_at, updated_at, deleted_at FROM sop_items WHERE deleted_at IS NULL ORDER BY created_at DESC")?;

        let items = stmt.query_map([], |row| {
            Ok(SopItem {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                item_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                deleted_at: row.get(6)?,
            })
        })?;

        items.collect()
    }

    pub fn soft_delete_sop_item(&self, id: i64) -> SqliteResult<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn
            .execute("UPDATE sop_items SET deleted_at = ?1, updated_at = ?1 WHERE id = ?2", (&now, id))?;
        Ok(())
    }

    pub fn rename_sop_item(&self, id: i64, name: &str) -> SqliteResult<SopItem> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE sop_items SET name = ?1, updated_at = ?2 WHERE id = ?3",
            (name, &now, id),
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, name, icon, item_type, created_at, updated_at, deleted_at FROM sop_items WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(SopItem {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                item_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                deleted_at: row.get(6)?,
            })
        })
    }

    pub fn get_deleted_sop_items(&self) -> SqliteResult<Vec<SopItem>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, icon, item_type, created_at, updated_at, deleted_at FROM sop_items WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;

        let items = stmt.query_map([], |row| {
            Ok(SopItem {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                item_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                deleted_at: row.get(6)?,
            })
        })?;

        items.collect()
    }

    pub fn restore_sop_item(&self, id: i64) -> SqliteResult<SopItem> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn
            .execute("UPDATE sop_items SET deleted_at = NULL, updated_at = ?1 WHERE id = ?2", (&now, id))?;

        let mut stmt = self.conn.prepare(
            "SELECT id, name, icon, item_type, created_at, updated_at, deleted_at FROM sop_items WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(SopItem {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                item_type: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                deleted_at: row.get(6)?,
            })
        })
    }

    pub fn permanently_delete_sop_item(&self, id: i64) -> SqliteResult<()> {
        self.conn
            .execute("DELETE FROM sop_items WHERE id = ?1", [id])?;
        Ok(())
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

    pub fn get_flow_data(&self, sop_id: i64) -> SqliteResult<Option<FlowData>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, sop_id, nodes, edges, created_at, updated_at FROM flow_data WHERE sop_id = ?1"
        )?;

        let result = stmt.query_row([sop_id], |row| {
            Ok(FlowData {
                id: row.get(0)?,
                sop_id: row.get(1)?,
                nodes: row.get(2)?,
                edges: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        });

        match result {
            Ok(data) => Ok(Some(data)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn save_flow_data(&self, sop_id: i64, nodes: &str, edges: &str) -> SqliteResult<FlowData> {
        let now = chrono::Utc::now().to_rfc3339();

        // Try to update existing record, or insert new one
        let existing = self.get_flow_data(sop_id)?;

        if existing.is_some() {
            self.conn.execute(
                "UPDATE flow_data SET nodes = ?1, edges = ?2, updated_at = ?3 WHERE sop_id = ?4",
                (nodes, edges, &now, sop_id),
            )?;
        } else {
            self.conn.execute(
                "INSERT INTO flow_data (sop_id, nodes, edges, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                (sop_id, nodes, edges, &now, &now),
            )?;
        }

        self.get_flow_data(sop_id)?.ok_or(rusqlite::Error::QueryReturnedNoRows)
    }

    pub fn get_ai_config(&self) -> SqliteResult<Option<AiConfig>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, base_url, api_key, model_name, created_at, updated_at FROM ai_config ORDER BY id DESC LIMIT 1"
        )?;

        let result = stmt.query_row([], |row| {
            Ok(AiConfig {
                id: row.get(0)?,
                base_url: row.get(1)?,
                api_key: row.get(2)?,
                model_name: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        });

        match result {
            Ok(config) => Ok(Some(config)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn save_ai_config(&self, config: &SaveAiConfig) -> SqliteResult<AiConfig> {
        let now = chrono::Utc::now().to_rfc3339();

        // Check if config exists
        let existing = self.get_ai_config()?;

        if let Some(existing_config) = existing {
            self.conn.execute(
                "UPDATE ai_config SET base_url = ?1, api_key = ?2, model_name = ?3, updated_at = ?4 WHERE id = ?5",
                (&config.base_url, &config.api_key, &config.model_name, &now, existing_config.id),
            )?;
        } else {
            self.conn.execute(
                "INSERT INTO ai_config (base_url, api_key, model_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                (&config.base_url, &config.api_key, &config.model_name, &now, &now),
            )?;
        }

        self.get_ai_config()?.ok_or(rusqlite::Error::QueryReturnedNoRows)
    }
}
