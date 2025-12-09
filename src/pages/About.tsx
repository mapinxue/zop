import { useTranslation } from "react-i18next";
import reactLogo from "../assets/react.svg";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <h1 className="text-2xl font-bold text-foreground">{t('about.title')}</h1>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('about.techStack')}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src="/tauri.svg" alt="Tauri" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">{t('about.tauri.name')}</h3>
            <p className="text-sm text-muted-foreground">{t('about.tauri.description')}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src={reactLogo} alt="React" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">{t('about.react.name')}</h3>
            <p className="text-sm text-muted-foreground">{t('about.react.description')}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src="/vite.svg" alt="Vite" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">{t('about.vite.name')}</h3>
            <p className="text-sm text-muted-foreground">{t('about.vite.description')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('about.projectInfo')}</h2>
        <ul className="space-y-2">
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t('about.version')}</span>
            <span className="text-foreground font-medium">0.1.0</span>
          </li>
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t('about.type')}</span>
            <span className="text-foreground font-medium">{t('about.desktopApp')}</span>
          </li>
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t('about.frontend')}</span>
            <span className="text-foreground font-medium">React + TypeScript</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted-foreground">{t('about.backend')}</span>
            <span className="text-foreground font-medium">Rust + Tauri</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
