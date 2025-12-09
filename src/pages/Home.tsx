import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SopItem {
  id: number;
  name: string;
  icon: string;
  item_type: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<SopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const result = await invoke<SopItem[]>("get_all_sop_items");
        setItems(result);
      } catch (error) {
        console.error("Failed to fetch items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleCreateNew = () => {
    navigate("/new");
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4 relative bottom-10">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
            <Layers className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t('home.welcome')}</h2>
            <p className="text-muted-foreground">
              {t('home.emptyMessage')}
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="w-5 h-5" />
            {t('common.newItem')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-muted-foreground">
        {t('home.selectItem')}
      </div>
    </div>
  );
}
