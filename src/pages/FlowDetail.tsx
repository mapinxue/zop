import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FlowDetail() {
  const { t } = useTranslation();
  const { id } = useParams();

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t('flowDetail.title')}</h2>
        <p className="text-muted-foreground">{t('flowDetail.subtitle')} (ID: {id})</p>
      </div>
    </div>
  );
}
