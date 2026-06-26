import { v2 as cloudinary } from "cloudinary";
import type { ImageUploader } from "../domain/ImageUploader.interface.js";
import type { ImageSignature, ImageSignatureProvider } from "../domain/ImageSignatureProvider.interface.js";
import { StoredImage } from "../domain/storage.js";

export class CloudinaryImageUploader implements ImageUploader, ImageSignatureProvider {
    constructor() {
        // Validamos la existencia de credenciales de forma temprana para evitar fallos silenciosos
        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            throw new Error(
                "Cloudinary credentials are missing in environment variables.",
            );
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    }

    async upload(base64Image: string, folder: string): Promise<StoredImage> {
        try {
            const uploadResult = await cloudinary.uploader.upload(base64Image, {
                folder: folder,
                resource_type: "image",
            });

            if (!uploadResult.secure_url) {
                throw new Error(
                    "Cloudinary upload response is missing the secure_url.",
                );
            }

            return new StoredImage(
                uploadResult.public_id,
                uploadResult.secure_url,
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown storage infrastructure error";
            throw new Error(`[Storage Infrastructure Error]: ${errorMessage}`);
        }
    }

    generateSignature(folder: string): ImageSignature {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        if (!apiSecret || !apiKey || !cloudName) {
            throw new Error(
                "[Storage Infrastructure Error]: Missing Cloudinary credentials to generate signature."
            );
        }

        const paramsToSign = {
            timestamp,
            folder,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        return {
            signature,
            timestamp,
            folder,
            apiKey,
            cloudName,
        };
    }
}

