import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export { cloudinary };

/**
 * Sube un archivo (Buffer) a Cloudinary y devuelve la URL y el public_id.
 */
export async function uploadImage(
    fileBuffer: Buffer,
    folder = "mezo/productos"
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto:good" },
                    { fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        uploadStream.end(fileBuffer);
    });
}

/**
 * Elimina una imagen de Cloudinary por su public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}