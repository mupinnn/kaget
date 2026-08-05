import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import type { SelectSingleEventHandler } from "react-day-picker";
import {
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { cn } from "@/libs/utils.lib";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { useCreateRecordMutation } from "../data/records.mutations";
import {
  type CreateRecordForm,
  CreateRecordFormSchema,
  RECORD_TYPE_LABEL,
} from "../data/records.schemas";

export function TotalRecordsAmount({
  control,
  errors,
  setValue,
}: {
  control: Control<CreateRecordForm>;
  errors: FieldErrors<CreateRecordForm>;
  setValue: UseFormSetValue<CreateRecordForm>;
}) {
  const recordItems = useWatch({ control, name: "items" });
  const totalAmount = recordItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  if (totalAmount) {
    setValue("amount", totalAmount);
  }

  if (recordItems.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed p-3">
      <h2 className="text-muted-foreground text-sm">Total amount</h2>
      <p className="font-semibold text-xl tabular-nums tracking-tight">
        {formatCurrency(totalAmount)}
      </p>
      {errors.amount?.message ? (
        <p className="font-medium text-[0.8rem] text-destructive">{errors.amount.message}</p>
      ) : null}
    </div>
  );
}

export function RecordsFormPage() {
  const navigate = useNavigate();
  const form = useForm<CreateRecordForm>({
    resolver: zodResolver(CreateRecordFormSchema),
    defaultValues: {
      note: "",
      dor: new Date(),
      items: [],
    },
  });
  const recordItems = useFieldArray({ control: form.control, name: "items" });
  const walletsQuery = useWalletsQuery();
  const createRecordMutation = useCreateRecordMutation();

  const hasNoWallets = (walletsQuery.data?.length ?? 0) === 0;
  const watchDor = form.watch("dor");
  const dorTimeValue = `${new Date(watchDor).getHours()}:${new Date(watchDor).getMinutes()}`;

  function onSubmit(values: CreateRecordForm) {
    createRecordMutation.mutate(values, {
      async onSuccess() {
        await navigate({ to: "/records" });
      },
    });
  }

  const handleDorTimeChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const time = event.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    const newSelectedDor = new Date(form.getValues("dor"));
    newSelectedDor.setHours(hours);
    newSelectedDor.setMinutes(minutes);

    form.setValue("dor", newSelectedDor);
  };

  const handleDorDateChange: SelectSingleEventHandler = selectedDay => {
    if (!selectedDay) {
      form.setValue("dor", new Date());
      return;
    }

    const [hours, minutes] = dorTimeValue.split(":").map(Number);
    const newDorDate = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      hours,
      minutes
    );

    form.setValue("dor", newDorDate);
  };

  if (walletsQuery.isPending) {
    return (
      <PageLayout
        title="Record cash flow"
        subtitle="Log income or expense against a wallet on this device."
      >
        <div className="max-w-lg space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (walletsQuery.isError) {
    return (
      <PageLayout
        title="Record cash flow"
        subtitle="Log income or expense against a wallet on this device."
      >
        <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
          Couldn&apos;t load wallets.{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => void walletsQuery.refetch()}
          >
            Try again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Record cash flow"
      subtitle="Log income or expense against a wallet on this device."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet</FormLabel>
                <Select
                  onValueChange={value =>
                    field.onChange(walletsQuery.data?.find(w => w.id === value))
                  }
                  defaultValue={field.value?.id}
                  disabled={hasNoWallets}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={hasNoWallets ? "Create a wallet first" : "Choose a wallet"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {walletsQuery.data?.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} - {formatCurrency(wallet.balance)}
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
            name="record_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Income or Expense" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">{RECORD_TYPE_LABEL.INCOME}</SelectItem>
                    <SelectItem value="EXPENSE">{RECORD_TYPE_LABEL.EXPENSE}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dor"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of record</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          formatDate(field.value, { timeStyle: "short" })
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto space-y-3 p-3" align="start">
                    <Input type="time" defaultValue={dorTimeValue} onChange={handleDorTimeChange} />
                    <Calendar
                      mode="single"
                      disabled={{ after: new Date() }}
                      selected={field.value as Date}
                      onSelect={handleDorDateChange}
                      initialFocus
                      className="p-0"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Defaults to now. Change if you are logging later.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {recordItems.fields.length === 0 ? (
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      autoComplete="off"
                      placeholder="e.g. 1.000.000"
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

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea autoComplete="off" placeholder="What this money was for…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {recordItems.fields.length > 0
            ? recordItems.fields.map((recordItem, recordItemIndex) => (
                <div className="space-y-3 rounded-lg border border-dashed p-3" key={recordItem.id}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium text-base tracking-tight">
                      Line {recordItemIndex + 1}
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => recordItems.remove(recordItemIndex)}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Remove line</span>
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${recordItemIndex}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            autoComplete="off"
                            placeholder="e.g. 1.000.000"
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

                  <FormField
                    control={form.control}
                    name={`items.${recordItemIndex}.note`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea autoComplete="off" placeholder="Line item note…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))
            : null}

          <Button
            type="button"
            className="w-full"
            variant="secondary"
            size="sm"
            onClick={() => recordItems.append({ amount: 0, note: "" })}
          >
            <PlusIcon /> Split record
          </Button>

          <TotalRecordsAmount
            control={form.control}
            setValue={form.setValue}
            errors={form.formState.errors}
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              size="sm"
              disabled={createRecordMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" size="sm" isLoading={createRecordMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
