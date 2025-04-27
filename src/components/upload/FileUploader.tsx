
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, X, FileText, Image } from "lucide-react";

interface FileUploaderProps {
  uploadedFiles: File[];
  onFileChange: (files: File[]) => void;
  isUploading: boolean;
  multiple?: boolean;
}

export const FileUploader = ({ 
  uploadedFiles, 
  onFileChange, 
  isUploading,
  multiple = false 
}: FileUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFileChange(filesArray);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFileChange(filesArray);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    onFileChange(newFiles);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 ${
        uploadedFiles.length > 0 ? "border-primary" : "border-border"
      } text-center`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {uploadedFiles.length === 0 ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-3">
              <UploadIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag & drop {multiple ? "files" : "file"} or{" "}
              <label className="text-primary cursor-pointer hover:underline">
                browse
                <Input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  multiple={multiple}
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, JPG, PNG (max 10MB per file)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-accent/30 p-3 rounded">
              <div className="flex items-center space-x-3">
                {file.type.includes('pdf') ? (
                  <FileText className="h-8 w-8 text-primary" />
                ) : (
                  <Image className="h-8 w-8 text-primary" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
