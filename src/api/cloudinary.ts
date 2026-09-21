export const subirImagenCloudinary = async (file: File): Promise<string> => {
  const cloudName = "p4ze0x7z";
  const uploadPreset = "platos_restaurante";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al subir la imagen a Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; 
  } catch (error) {
    console.error("Error en Cloudinary:", error);
    throw error;
  }
};