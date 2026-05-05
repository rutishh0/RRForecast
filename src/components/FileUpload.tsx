// V5/src/components/FileUpload.tsx
//
// Excel upload with browser preview + base64-encoded POST to /api/engine-data/upload.
// Server re-parses and replaces all rows transactionally; the response is
// the authoritative parse and replaces the local state.

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { parseWorkbook, parseSingleShopSheet, parseSingleForecastSheet } from "@/src/utils/parseExcel";
import { engineDataAPI } from "@/src/services/api";
import type { ShopVisitRecord, ForecastRecord, ParsedWorkbook } from "@/src/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onUploaded: (result: { shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[]; warnings?: string[] }) => void;
}

async function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function FileUpload({ isOpen, onClose, isLoading: externalLoading, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedWorkbook | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (selected: File) => {
    setFile(selected);
    setError(null);
    setPreview(null);
    try {
      const parsed = await parseWorkbook(selected);
      setPreview(parsed);
    } catch (e: any) {
      setError(`Could not parse the workbook: ${e.message ?? "unknown error"}`);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file || !preview) return;
    setUploading(true);
    setError(null);
    try {
      const rawXlsxBase64 = await readAsBase64(file);
      const result = await engineDataAPI.upload(rawXlsxBase64, preview);
      onUploaded({ shopVisits: result.shopVisits, forecasts: result.forecasts, warnings: result.warnings });
      // Reset for next upload
      setFile(null);
      setPreview(null);
      onClose();
    } catch (e: any) {
      setError(`Upload failed: ${e.message ?? "unknown error"}`);
    } finally {
      setUploading(false);
    }
  }, [file, preview, onUploaded, onClose]);

  if (!isOpen) return null;

  const busy = uploading || externalLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] flex flex-col rounded-xl border border-rr-border bg-rr-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-rr-border">
          <h2 className="text-base font-bold text-rr-text">Upload Workbook</h2>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-rr-navy-50 disabled:opacity-50">
            <X size={16} className="text-rr-text-dim" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!file && (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-rr-border hover:border-rr-gold/50
                         rounded-lg p-8 text-center cursor-pointer transition-colors"
            >
              <FileSpreadsheet size={36} className="text-rr-gold mx-auto mb-3" />
              <p className="text-sm text-rr-text">Click to select an .xlsx workbook</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          )}

          {file && preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-rr-success" />
                <div>
                  <p className="text-sm text-rr-text font-semibold">{file.name}</p>
                  <p className="text-xs text-rr-text-dim">
                    {preview.shopVisits.length} shop visits · {preview.forecasts.length} forecasts
                  </p>
                </div>
              </div>
              <p className="text-xs text-rr-text-muted">
                Click Upload to replace the current dataset on the server. The previous data will be deleted.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded bg-rr-danger-bg border border-rr-danger-border">
              <AlertTriangle size={14} className="text-rr-danger shrink-0 mt-0.5" />
              <p className="text-xs text-rr-danger">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-rr-border">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-3 py-2 rounded text-sm text-rr-text-dim hover:text-rr-text disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file || !preview || busy}
            className="flex items-center gap-2 px-4 py-2 rounded bg-rr-gold text-rr-bg-secondary
                       font-semibold text-sm hover:bg-rr-gold-bright disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <><Loader2 size={14} className="animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={14} /> Upload</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-export the standalone parsers for any other component that wants them
export { parseSingleShopSheet, parseSingleForecastSheet };
