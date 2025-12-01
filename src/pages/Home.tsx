import { FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">内容容器</h2>
        <p className="text-muted-foreground max-w-md">
          这是内容显示区域的占位符。选择左侧的项目来查看详细内容。
        </p>
      </div>
    </div>
  );
}
