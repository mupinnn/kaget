import { EyeIcon, EyeOffIcon } from "lucide-react";
import { formatCurrency } from "@/utils/common.util";
import { Button } from "./ui/button";
import { useHidableBalance } from "./providers/hidable-balance-provider";

export function ToggleHidableBalance() {
  const { hidden, toggleHidable } = useHidableBalance();

  return (
    <Button variant="ghost" size="icon" onClick={toggleHidable}>
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
    </Button>
  );
}

export function HidableBalance({ value }: { value: number | string }) {
  const { hidden } = useHidableBalance();

  if (hidden) return <span className="align-middle tracking-wide">********</span>;

  return typeof value === "string" ? value : formatCurrency(value);
}
