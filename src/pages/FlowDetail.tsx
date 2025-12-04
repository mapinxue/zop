import { useParams } from "react-router-dom";

export default function FlowDetail() {
  const { id } = useParams();

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">流程图</h2>
        <p className="text-muted-foreground">流程图详情页 (ID: {id})</p>
      </div>
    </div>
  );
}
