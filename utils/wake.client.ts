let wakeLock: any;

export async function activateKeepAwake() {
  if ("wakeLock" in navigator) {
    wakeLock = await navigator.wakeLock.request("screen");
  }
}

export async function deactivateKeepAwake() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}
