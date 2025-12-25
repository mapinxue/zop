import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AiConfig {
  id: number;
  base_url: string;
  api_key: string;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export default function AiConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<AiConfig | null>("get_ai_config");
        if (config) {
          setBaseUrl(config.base_url);
          setApiKey(config.api_key);
          setModelName(config.model_name);
        }
      } catch (error) {
        console.error("Failed to load AI config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim() || !modelName.trim() || !baseUrl.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await invoke("save_ai_config", {
        config: {
          base_url: baseUrl,
          api_key: apiKey,
          model_name: modelName,
        },
      });
      navigate(-1);
    } catch (error) {
      console.error("Failed to save AI config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("aiConfig.title")}
          </h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">{t("aiConfig.baseUrl")}</Label>
            <Input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={t("aiConfig.baseUrlPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("aiConfig.baseUrlHint")}
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">{t("aiConfig.apiKey")}</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("aiConfig.apiKeyPlaceholder")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="modelName">{t("aiConfig.modelName")}</Label>
            <Input
              id="modelName"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={t("aiConfig.modelPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("aiConfig.modelHint")}
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim() || !modelName.trim() || !baseUrl.trim()}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
