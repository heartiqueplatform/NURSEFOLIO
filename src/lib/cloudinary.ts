export async function uploadToCloudinary(
    file: File,
    resourceType: 'image' | 'raw' = 'image'
) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const endpoint =
        resourceType === 'raw'
            ? `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
            : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(data);
        throw new Error(data.error?.message || 'Cloudinary upload failed');
    }

    return {
        url: data.secure_url,
        publicId: data.public_id,
    };
}

export const deleteFromCloudinary = async (publicId: string) => {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-cloudinary-file`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    public_id: publicId,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete file');
        }

        return data;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};