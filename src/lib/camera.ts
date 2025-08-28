export async function initializeCamera(
  facingMode: "user" | "environment" = "environment" // default: back camera
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode, // dynamically switch between front/back
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    console.error("Camera initialization failed:", error);
    throw new Error("Failed to access camera. Please check camera permissions.");
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
