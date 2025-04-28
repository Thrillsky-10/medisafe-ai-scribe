
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SignatureFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SignatureField({ value, onChange }: SignatureFieldProps) {
  const [signatureType, setSignatureType] = useState<"draw" | "upload" | "text">(
    "draw"
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textSignature, setTextSignature] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set styles
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    // If there's a saved drawing, restore it
    if (value && signatureType === "draw" && value.startsWith("data:image/png;base64,")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [signatureType, value]);

  // Handle drawing start
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    // Get coordinates
    let x, y;
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Handle drawing
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get coordinates
    let x, y;
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Handle drawing end
  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    // Save the drawing as data URL
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle text signature
  const handleTextSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextSignature(e.target.value);
    onChange(e.target.value);
  };

  // Clear signature
  const clearSignature = () => {
    if (signatureType === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (signatureType === "upload") {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (signatureType === "text") {
      setTextSignature("");
    }

    onChange("");
    setShowClearDialog(false);
  };

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="draw"
        value={signatureType}
        onValueChange={(value) => setSignatureType(value as "draw" | "upload" | "text")}
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="pt-4">
          <div className="border rounded-md p-2">
            <canvas
              ref={canvasRef}
              width={500}
              height={150}
              className="border w-full touch-none cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Draw your signature using your mouse or touch screen
          </p>
        </TabsContent>

        <TabsContent value="upload" className="pt-4">
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
            />
            {value && value.startsWith("data:image") && (
              <div className="mt-4 border rounded-md p-2">
                <img
                  src={value}
                  alt="Uploaded signature"
                  className="max-h-[150px] mx-auto"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="text" className="pt-4">
          <div className="space-y-4">
            <Input
              placeholder="Type your full name"
              value={textSignature}
              onChange={handleTextSignatureChange}
            />
            {textSignature && (
              <div className="mt-4 border rounded-md p-4 bg-white">
                <p className="font-signature text-lg">{textSignature}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowClearDialog(true)}
          size="sm"
        >
          Clear Signature
        </Button>
      </div>

      {/* Clear confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear signature?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your signature will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearSignature}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
