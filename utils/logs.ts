import moment from "moment";

export function showLogText(log: any) {
  // const duration = showDuration(log.time);
  const timeObj = moment
    .utc(log.created_at)
    .subtract(log.time, "milliseconds")
    .local();
  return `${timeObj.format("ll")} - ${timeObj.format("hh:mm A")}`;
}

const pluralize = (val: number, s: string) =>
  `${val} ${s}${val === 1 ? "" : "s"}`;

export function showDuration(
  timeMs: number | string,
  isSeconds = false,
  noZero = false,
  prefix = "",
) {
  try {
    const parsedTime = typeof timeMs === "string" ? parseInt(timeMs) : timeMs;
    if (isNaN(parsedTime)) return "";
    const time = parsedTime * (isSeconds ? 1000 : 1);
    if (noZero && time === 0) return "";
    const hours = moment.duration(time).hours();
    const minutes = moment.duration(time).minutes();
    const seconds = moment.duration(time).seconds();
    const ms = moment.duration(time).milliseconds();
    let duration = [];
    if (hours > 0) duration.push(pluralize(hours, "hour"));
    if (minutes > 0) duration.push(pluralize(minutes, "minute"));
    if (seconds > 0) duration.push(pluralize(seconds, "second"));
    if (duration.length === 0) duration.push(`${ms} ms`);
    return prefix + duration.join(" ");
  } catch {
    return "";
  }
}
