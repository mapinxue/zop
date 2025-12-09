import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { Plus, ListTodo, Square, CheckSquare, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TodoItem {
  id: number;
  sop_id: number;
  content: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SopItem {
  id: number;
  name: string;
  icon: string;
  item_type: string;
  created_at: string;
  updated_at: string;
}

interface SortableTodoItemProps {
  item: TodoItem;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function SortableTodoItem({ item, onToggle, onDelete }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group ${isDragging ? "z-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div
        className={`flex-1 flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors ${
          isDragging ? "shadow-lg" : ""
        }`}
      >
        <button
          onClick={() => onToggle(item.id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.completed ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
        <span
          className={`flex-1 ${
            item.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {item.content}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TodoDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const sopId = Number(id);

  const [items, setItems] = useState<TodoItem[]>([]);
  const [sopItem, setSopItem] = useState<SopItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const result = await invoke<TodoItem[]>("get_todo_items", { sopId });
      setItems(result);
    } catch (error) {
      console.error("Failed to fetch todo items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSopItem = async () => {
    try {
      const allItems = await invoke<SopItem[]>("get_all_sop_items");
      const item = allItems.find((i) => i.id === sopId);
      if (item) {
        setSopItem(item);
      }
    } catch (error) {
      console.error("Failed to fetch sop item:", error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSopItem();
  }, [sopId]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;

    try {
      const newItem = await invoke<TodoItem>("create_todo_item", {
        item: {
          sop_id: sopId,
          content: newContent.trim(),
        },
      });
      setItems([...items, newItem]);
      setNewContent("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to create todo item:", error);
    }
  };

  const handleCancel = () => {
    setNewContent("");
    setIsAdding(false);
  };

  const handleToggle = async (itemId: number) => {
    try {
      const updatedItem = await invoke<TodoItem>("toggle_todo_item", { id: itemId });
      setItems(items.map((item) => (item.id === itemId ? updatedItem : item)));
    } catch (error) {
      console.error("Failed to toggle todo item:", error);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await invoke("delete_todo_item", { id: itemId });
      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Failed to delete todo item:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Save the new order to backend
      try {
        const itemIds = newItems.map((item) => item.id);
        await invoke("reorder_todo_items", { itemIds });
      } catch (error) {
        console.error("Failed to reorder todo items:", error);
        // Revert on error
        fetchItems();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Add new item form */}
      {isAdding && (
        <div className="p-4 border-b border-border">
          <Input
            type="text"
            placeholder={t('todoDetail.taskPlaceholder')}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!newContent.trim()}>
              {t('todoDetail.addTask')}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !isAdding && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ListTodo className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-foreground">{t('todoDetail.emptyTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('todoDetail.emptyMessage')}
              </p>
            </div>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('todoDetail.newTask')}
            </Button>
          </div>
        </div>
      )}

      {/* Todo list */}
      {items.length > 0 && (
        <div className="p-4">
          {!isAdding && (
            <div className="flex items-center justify-between mb-4 ml-6">
              <h2 className="text-lg font-semibold text-foreground">
                {sopItem?.name || ""}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('todoDetail.newTask')}
              </Button>
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableTodoItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
