/**
 * Initialize camera stream
 * @param facingMode "user" (front) or "environment" (back)
 * @returns MediaStream
 */
export async function initializeCamera(
  facingMode: "user" | "environment" = "environment"
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode, // front/back
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    console.error("Camera initialization failed:", error);
    throw new Error("Failed to access camera. Please check camera permissions.");
  }
}

/**
 * Stop all tracks of a given MediaStream
 * @param stream MediaStream
 */
export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
