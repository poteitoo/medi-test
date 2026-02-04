/**
 * 録音中インジケーター
 */
export const RecordingIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-sm text-muted-foreground">録音中...</span>
    </div>
  );
};
