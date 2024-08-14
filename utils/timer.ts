export const getTimerString = (ms, noMinus = false) => {
  try {
    const timerSeconds = Math.abs(Math.ceil(ms / 1000));
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${ms < -500 && !noMinus ? "-" : ""}${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")}`;
  } catch {
    return "";
  }
};
