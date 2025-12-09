import { useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

export default function Settings() {
  const { t } = useTranslation();
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  async function toggleAlwaysOnTop() {
    try {
      const newState = await invoke("toggle_always_on_top");
      setIsAlwaysOnTop(newState as boolean);
    } catch (error) {
      console.error("Failed to toggle always on top:", error);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.window.title')}</h2>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <h3 className="font-medium text-foreground">{t('settings.window.alwaysOnTop')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.window.alwaysOnTopDesc')}</p>
          </div>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isAlwaysOnTop
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            onClick={toggleAlwaysOnTop}
          >
            {isAlwaysOnTop ? t('common.enabled') : t('common.disabled')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.appearance.title')}</h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium text-foreground">{t('settings.appearance.theme')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.appearance.themeDesc')}</p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            className="px-4 py-2 rounded-md bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="light">{t('settings.appearance.light')}</option>
            <option value="dark">{t('settings.appearance.dark')}</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.aboutSettings.title')}</h2>
        <p className="text-muted-foreground">
          {t('settings.aboutSettings.description')}
        </p>
      </div>
    </div>
  );
}
