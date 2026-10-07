import { PDFDocument } from "pdf-lib";

/**
 * แปลงไฟล์รูปภาพทุกฟอร์แมต (PNG, JPG, WebP ฯลฯ) เป็น JPEG bytes และขนาดรูปจริง
 * เพื่อให้ pdfDoc.embedJpg รองรับทุกฟอร์แมตได้ 100% โดยไม่มีข้อจำกัดเรื่องนามสกุล
 */
function imageFileToJpegData(
  file: File
): Promise<{ bytes: ArrayBuffer; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 1100;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("ไม่สามารถสร้าง Canvas Context ได้"));
          return;
        }

        // วาดพื้นหลังสีขาวก่อน (กรณี PNG โปร่งใส)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error("แปลงรูปภาพเป็น Blob ไม่สำเร็จ"));
              return;
            }
            const buffer = await blob.arrayBuffer();
            resolve({
              bytes: buffer,
              width: canvas.width,
              height: canvas.height,
            });
          },
          "image/jpeg",
          0.92
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`โหลดไฟล์ภาพ "${file.name}" ไม่สำเร็จ`));
    };

    img.src = objectUrl;
  });
}

/**
 * รวมไฟล์รูปภาพหลายไฟล์ (หรือแผ่นเดียว) ให้กลายเป็นเอกสาร PDF 1 เล่ม
 * แต่ละหน้า PDF จะมีขนาดกว้างxยาว พอดีกับขนาดของรูปภาพนั้นๆ
 */
export async function mergeImagesToPdf(
  files: File[],
  fileName = "combined_notes.pdf"
): Promise<File> {
  if (files.length === 0) {
    throw new Error("ไม่มีไฟล์รูปภาพให้แปลง");
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const { bytes, width, height } = await imageFileToJpegData(file);
    const embeddedImage = await pdfDoc.embedJpg(bytes);

    // สร้างหน้าใหม่ตามขนาดจริงของภาพ
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const safeName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const buffer = pdfBytes.buffer as ArrayBuffer;
  return new File([buffer], safeName, { type: "application/pdf" });
}
