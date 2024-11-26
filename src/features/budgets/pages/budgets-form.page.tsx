import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/page-layout";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { formatCurrency } from "@/utils/common.util";
import { CreateBudgetSchema, CreateBudget } from "../data/budgets.schema";
import { useCreateBudgetMutation } from "../data/budgets.mutations";

export function BudgetsFormPage() {
  const form = useForm<CreateBudget>({
    resolver: zodResolver(CreateBudgetSchema),
    defaultValues: {
      name: "",
      allocated_digital_balance: 0,
      allocated_cash_balance: 0,
      items: [],
    },
  });
  const selectedDigitalWallet = form.watch("digital_wallet");
  const selectedCashWallet = form.watch("cash_wallet");

  const digitalWalletsQuery = useWalletsQuery({ type: "DIGITAL" });
  const cashWalletsQuery = useWalletsQuery({ type: "CASH" });
  const createBudgetMutation = useCreateBudgetMutation();

  const isDigitalWalletsEmpty = digitalWalletsQuery.data?.data.length === 0;
  const isCashWalletsEmpty = cashWalletsQuery.data?.data.length === 0;

  function onSubmit(values: CreateBudget) {
    createBudgetMutation.mutate(values);
  }

  return (
    <PageLayout title="Allocate new budget">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="digital_wallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digital wallet</FormLabel>
                  <Select
                    onValueChange={value =>
                      field.onChange(digitalWalletsQuery.data?.data.find(w => w.id === value))
                    }
                    defaultValue={field.value?.id}
                    disabled={digitalWalletsQuery.isPending || isDigitalWalletsEmpty}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isDigitalWalletsEmpty ? "No digital wallet" : "Choose a digital wallet"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {digitalWalletsQuery.data?.data.map(digitalWallet => (
                        <SelectItem key={digitalWallet.id} value={digitalWallet.id}>
                          {digitalWallet.name} - {formatCurrency(digitalWallet.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your source wallet for the digital balance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cash_wallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash wallet</FormLabel>
                  <Select
                    onValueChange={value =>
                      field.onChange(cashWalletsQuery.data?.data.find(w => w.id === value))
                    }
                    defaultValue={field.value?.id}
                    disabled={cashWalletsQuery.isPending || isCashWalletsEmpty}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isCashWalletsEmpty ? "No cash wallet" : "Choose a cash wallet"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cashWalletsQuery.data?.data.map(cashWallet => (
                        <SelectItem key={cashWallet.id} value={cashWallet.id}>
                          {cashWallet.name} - {formatCurrency(cashWallet.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose your source wallet for the cash balance</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder="e.g., Gunpla" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDigitalWallet ? (
              <FormField
                control={form.control}
                name="allocated_digital_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Digital balance</FormLabel>
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
            ) : null}

            {selectedCashWallet ? (
              <FormField
                control={form.control}
                name="allocated_cash_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash balance</FormLabel>
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
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => console.log("breakdown")}
            variant="secondary"
          >
            <PlusIcon /> Add budget breakdown
          </Button>

          <div className="flex items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              disabled={createBudgetMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" isLoading={createBudgetMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
