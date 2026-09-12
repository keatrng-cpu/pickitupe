/**
 * Get a receipt photo or PDF ready to send to `scanReceipt`.
 *
 * Photos are re-encoded to a 1600 px JPEG — plenty for a model to read line
 * items and serials, and it keeps a 12 MP phone shot under ~500 KB so the
 * upload fits comfortably inside the serverless body limit. PDFs go as-is,
 * capped at 4.5 MB.
 */
export const MAX_PDF_BYTES = 4_500_000;

export async function prepareReceiptFile(file: File): Promise<{ dataUrl: string; kind: "image" | "pdf" }> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_PDF_BYTES) throw new Error("That PDF is over 4.5 MB — export a smaller one or photograph the page.");
    return { dataUrl: await readAsDataUrl(file), kind: "pdf" };
  }
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Use a photo (JPG, PNG, WebP) or a PDF.");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't open that image. iPhone HEIC files need to be shared as JPG — or take the photo from inside the browser."));
      el.src = url;
    });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process the image.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), kind: "image" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}
