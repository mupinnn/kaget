import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarIcon } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import type { SelectSingleEventHandler } from "react-day-picker";
import { useForm } from "react-hook-form";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { cn } from "@/libs/utils.lib";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { useCreateDebtLoanMutation } from "../data/debt-loans.mutations";
import { type CreateDebtLoan, createDebtLoanSchema } from "../data/debt-loans.schemas";

export function DebtLoansFormPage() {
  const navigate = useNavigate();
  const walletsQuery = useWalletsQuery();
  const createDebtLoanMutation = useCreateDebtLoanMutation();

  const form = useForm<CreateDebtLoan>({
    resolver: zodResolver(createDebtLoanSchema),
    defaultValues: {
      type: "DEBT",
      occurred_at: new Date(),
    },
  });

  const watchOccurredAt = form.watch("occurred_at");
  const occurredAtTimeValue = `${new Date(watchOccurredAt).getHours()}:${new Date(watchOccurredAt).getMinutes()}`;

  const onSubmit = (values: CreateDebtLoan) => {
    createDebtLoanMutation.mutate(values, {
      async onSuccess(data) {
        await navigate({ to: "/debts-loans/$debtLoanId", params: { debtLoanId: data.id } });
      },
    });
  };

  const handleOccurredAtTimeChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const time = event.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    const nextDate = new Date(form.getValues("occurred_at"));
    nextDate.setHours(hours);
    nextDate.setMinutes(minutes);
    form.setValue("occurred_at", nextDate);
  };

  const handleOccurredAtDateChange: SelectSingleEventHandler = selectedDay => {
    if (!selectedDay) {
      form.setValue("occurred_at", new Date());
      return;
    }

    const [hours, minutes] = occurredAtTimeValue.split(":").map(Number);
    form.setValue(
      "occurred_at",
      new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        hours,
        minutes
      )
    );
  };

  return (
    <PageLayout title="Create debt or loan">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DEBT">DEBT (you owe)</SelectItem>
                    <SelectItem value="LOAN">LOAN (you lent)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose wallet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {walletsQuery.data?.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} - {formatCurrency(Number.parseFloat(wallet.balance))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="other_party"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other party</FormLabel>
                <FormControl>
                  <Input placeholder="Who owes or is owed?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencyInput
                    allowNegativeValue={false}
                    customInput={Input}
                    inputMode="numeric"
                    onValueChange={value => field.onChange(value)}
                    placeholder="e.g, 1.000.000"
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="occurred_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Occurred at</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        variant="outline"
                      >
                        {field.value
                          ? formatDate(field.value, { timeStyle: "short" })
                          : "Pick a date"}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto space-y-3 p-3">
                    <Input
                      defaultValue={occurredAtTimeValue}
                      onChange={handleOccurredAtTimeChange}
                      type="time"
                    />
                    <Calendar
                      className="p-0"
                      disabled={{ after: new Date() }}
                      initialFocus
                      mode="single"
                      onSelect={handleOccurredAtDateChange}
                      selected={field.value as Date}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional note" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-2">
            <Button asChild className="no-underline" variant="outline">
              <Link to="/debts-loans">Back</Link>
            </Button>
            <Button isLoading={createDebtLoanMutation.isPending} type="submit">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
