import { COLORS } from "../theme";
import { daysBetween, nextDueDate } from "../lib/dates";

export function statusColor(s){return s==="red"?COLORS.red:s==="amber"?COLORS.amber:s==="grey"?COLORS.slate:COLORS.green;}
export function maintStatus(item){const days=daysBetween(nextDueDate(item.last_completed,item.interval_days));if(days<0)return"overdue";if(days<=7)return"due-soon";return"ok";}
export function maintColor(s){return s==="overdue"?COLORS.red:s==="due-soon"?COLORS.amber:COLORS.green;}
