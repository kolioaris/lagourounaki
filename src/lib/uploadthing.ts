import { generateComponents } from "@uploadthing/react";
import type { OurFileRouter } from "../api/uploadthing";
 
export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();