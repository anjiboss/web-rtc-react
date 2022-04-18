// ANCHOR Captrue Screen
export const startCapture = async (
  displayMediaOptions: DisplayMediaStreamConstraints
) => {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error("Error: " + err);
  }
  return captureStream;
};
