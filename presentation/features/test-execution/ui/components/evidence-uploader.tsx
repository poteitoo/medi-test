import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

type EvidenceFile = {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url?: string;
};

type EvidenceUploaderProps = {
  readonly onFilesChange: (files: readonly EvidenceFile[]) => void;
  readonly maxFiles?: number;
  readonly maxFileSize?: number; // in bytes
  readonly acceptedTypes?: readonly string[];
  readonly existingFiles?: readonly EvidenceFile[];
};

/**
 * EvidenceUploader Component
 *
 * テスト結果のエビデンス（スクリーンショット、ログファイル等）をアップロードするコンポーネント
 *
 * @remarks
 * This is a stub implementation. Full file upload functionality requires:
 * - Storage service (S3, Azure Blob, etc.)
 * - Upload endpoint
 * - Progress tracking
 * - File validation
 */
export function EvidenceUploader({
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ["image/*", "text/*", ".log", ".txt", ".pdf"],
  existingFiles = [],
}: EvidenceUploaderProps) {
  const [files, setFiles] = useState<readonly EvidenceFile[]>(existingFiles);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles) return;

      setError(null);

      // Check file count
      if (files.length + selectedFiles.length > maxFiles) {
        setError(`最大${maxFiles}ファイルまでアップロード可能です`);
        return;
      }

      // Validate and convert to EvidenceFile
      const newFiles: EvidenceFile[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Check file size
        if (file.size > maxFileSize) {
          setError(`${file.name}: ファイルサイズが大きすぎます（最大: ${formatFileSize(maxFileSize)}）`);
          continue;
        }

        newFiles.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          // TODO: Implement actual file upload and get URL
          url: undefined,
        });
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, maxFileSize, onFilesChange],
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const updatedFiles = files.filter((f) => f.id !== fileId);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, onFilesChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>エビデンスファイル</CardTitle>
        <CardDescription>
          スクリーンショット、ログファイル等をアップロード（最大{maxFiles}ファイル、{formatFileSize(maxFileSize)}まで）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="evidence-files">ファイルを選択</Label>
          <Input
            id="evidence-files"
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            disabled={files.length >= maxFiles}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>アップロード済みファイル ({files.length}/{maxFiles})</Label>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getFileExtension(file.name)}</Badge>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for future features */}
        <p className="text-xs text-muted-foreground">
          ℹ️ Note: 実際のファイルアップロードは未実装です。ファイル選択のUIのみ提供しています。
        </p>
      </CardContent>
    </Card>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : "FILE";
}
