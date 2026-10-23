export async function extractPdf(file) {
  const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");
  const lib = pdfjs.getDocument ? pdfjs : pdfjs.default;
  lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await lib.getDocument({ data }).promise;
  const pageCount = Math.min(doc.numPages, 8);
  const parts = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    parts.push(content.items.map((item) => item.str).join(" "));
  }
  const text = parts.join("\n").replace(/[ \t]{2,}/g, " ").replace(/\n{2,}/g, "\n").trim();
  return normalizePdfText(text).slice(0, 8000);
}

function normalizePdfText(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const hangulTokens = tokens.filter((token) => /[가-힣]/.test(token));
  const singles = hangulTokens.filter((token) => /^[가-힣]$/.test(token.replace(/[.,!?]/g, ""))).length;
  let value = text;
  if (hangulTokens.length > 8 && singles / hangulTokens.length > 0.6) {
    value = value.replace(/([가-힣])\s+(?=[가-힣])/g, "$1");
    value = value.replace(/\s+([.,!?])/g, "$1");
  }
  return value.replace(/[ \t]{2,}/g, " ").trim();
}
