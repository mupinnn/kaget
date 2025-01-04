import { useState } from "react";
import { match } from "ts-pattern";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  TransformedBudgetWithRelations,
  UpdateBudgetBalance,
  UpdateBudgetBalanceSchema,
} from "../data/budgets.schemas";
import { useUpdateBudgetBalanceMutation } from "../data/budgets.mutations";

interface BudgetBalanceUpdateDialogProps {
  trigger: React.ReactNode;
  budgetDetail: TransformedBudgetWithRelations;
  type: UpdateBudgetBalance["type"];
}

export function BudgetBalanceUpdateDialog({
  trigger,
  budgetDetail,
  type,
}: BudgetBalanceUpdateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<UpdateBudgetBalance>({
    resolver: zodResolver(UpdateBudgetBalanceSchema),
    defaultValues: {
      type,
    },
  });
  const updateBudgetBalanceMutation = useUpdateBudgetBalanceMutation();

  function onSubmit(values: UpdateBudgetBalance) {
    updateBudgetBalanceMutation.mutate(
      { budgetId: budgetDetail.id, data: values },
      {
        onSuccess() {
          setIsOpen(false);
        },
        onError(error) {
          form.setError("balance", { message: error.message });
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {match(type)
                  .with("REFUND", () => "Refund to")
                  .otherwise(() => "Add balance from")}{" "}
                {budgetDetail.wallet.name}
              </DialogTitle>
              <DialogDescription>
                {match(type)
                  .with(
                    "REFUND",
                    () => "You able to refund some balance from this budget to its source wallet"
                  )
                  .otherwise(
                    () => "You able to add balance to this budget from the selected source wallet"
                  )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        autoComplete="off"
                        placeholder="e.g, 1.000.000"
                        allowNegativeValue={false}
                        inputMode="numeric"
                        customInput={Input}
                        value={field.value}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        onValueChange={value => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" isLoading={updateBudgetBalanceMutation.isPending}>
                {match(type)
                  .with("REFUND", () => "Refund")
                  .otherwise(() => "Add balance")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
