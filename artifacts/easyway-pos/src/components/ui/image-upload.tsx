import { useRef, useState } from "react";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);

  const handleFile = async (file: File) => {
    // Show a local blob preview immediately so the user gets instant feedback
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      // VITE_API_URL is set for cross-domain Vercel deployments; empty in dev
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
      const res = await fetch(`${apiBase}/api/upload/product-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? "Upload failed");
      }

      const { url } = (await res.json()) as { url: string };
      onChange(url);
      URL.revokeObjectURL(objectUrl);
      setPreview(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      // Revert preview to the previously saved value
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be picked again
          e.target.value = "";
        }}
      />

      {preview ? (
        /* ── Image preview card ── */
        <div className="relative rounded-xl overflow-hidden border border-border w-full aspect-video bg-muted">
          <img
            src={preview}
            alt="Product"
            className="w-full h-full object-cover"
          />

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {!uploading && (
            <>
              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Change button */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        /* ── Empty picker ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium text-muted-foreground">
            Tap to upload image
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WEBP · max 5 MB
          </span>
        </button>
      )}
    </div>
  );
}
