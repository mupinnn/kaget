import { useState } from "react";
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
  RefundBudgetSchema,
  RefundBudget,
} from "../data/budgets.schema";
import { useRefundBudgetMutation } from "../data/budgets.mutations";

interface BudgetRefundDialogProps {
  trigger: React.ReactNode;
  budgetDetail: TransformedBudgetWithRelations;
}

export function BudgetRefundDialog({ trigger, budgetDetail }: BudgetRefundDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<RefundBudget>({
    resolver: zodResolver(RefundBudgetSchema),
  });
  const refundBudgetMutation = useRefundBudgetMutation();

  function onSubmit(values: RefundBudget) {
    refundBudgetMutation.mutate(
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
              <DialogTitle>Refund to {budgetDetail.wallet.name}</DialogTitle>
              <DialogDescription>
                You able to refund some balance from this budget to its source wallet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance to be refunded</FormLabel>
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
              <Button type="submit" isLoading={refundBudgetMutation.isPending}>
                Refund
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
