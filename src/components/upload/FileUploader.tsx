
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, X, FileText, Image } from "lucide-react";

interface FileUploaderProps {
  uploadedFile: File | null;
  onFileChange: (file: File | null) => void;
  isUploading: boolean;
}

export const FileUploader = ({ uploadedFile, onFileChange, isUploading }: FileUploaderProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    onFileChange(null);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 ${
        uploadedFile ? "border-primary" : "border-border"
      } text-center`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!uploadedFile ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-3">
              <UploadIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag & drop file or{" "}
              <label className="text-primary cursor-pointer hover:underline">
                browse
                <Input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, JPG, PNG (max 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-accent/30 p-3 rounded">
          <div className="flex items-center space-x-3">
            {uploadedFile.type.includes('pdf') ? (
              <FileText className="h-8 w-8 text-primary" />
            ) : (
              <Image className="h-8 w-8 text-primary" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={removeFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
