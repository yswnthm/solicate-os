import { classNames } from "@/lib/utils";

export function StatusPill({ value }: { value: string }) {
  return <span className={classNames("pill", value)}>{value.replaceAll("_", " ")}</span>;
}
