import { Link, useNavigate } from "@tanstack/react-router";
import {
  Control,
  useFieldArray,
  useForm,
  UseFormSetValue,
  useWatch,
  FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { SelectSingleEventHandler } from "react-day-picker";
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { PageLayout } from "@/components/page-layout";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { cn } from "@/libs/utils.lib";
import { useCreateRecordMutation } from "../data/records.mutations";
import { CreateRecord, CreateRecordSchema } from "../data/records.schemas";

export function TotalRecordsAmount({
  control,
  errors,
  setValue,
}: {
  control: Control<CreateRecord>;
  errors: FieldErrors<CreateRecord>;
  setValue: UseFormSetValue<CreateRecord>;
}) {
  const recordItems = useWatch({ control, name: "items" });
  const totalAmount = recordItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  if (totalAmount) {
    setValue("amount", totalAmount);
  }

  if (recordItems.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed p-4">
      <h2 className="text-muted-foreground">Total amount</h2>
      <p className="text-2xl font-medium">{formatCurrency(totalAmount)}</p>
      {errors.amount?.message && (
        <p className="text-[0.8rem] font-medium text-destructive">{errors.amount.message}</p>
      )}
    </div>
  );
}

export function RecordsFormPage() {
  const navigate = useNavigate();
  const form = useForm<CreateRecord>({
    resolver: zodResolver(CreateRecordSchema),
    defaultValues: {
      note: "",
      dor: new Date(),
      items: [],
    },
  });
  const recordItems = useFieldArray({ control: form.control, name: "items" });
  const walletsQuery = useWalletsQuery();
  const createRecordMutation = useCreateRecordMutation();

  const hasNoWallets = walletsQuery.data?.data.length === 0;
  const watchDor = form.watch("dor");
  const dorTimeValue = `${new Date(watchDor).getHours()}:${new Date(watchDor).getMinutes()}`;

  function onSubmit(values: CreateRecord) {
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

  return (
    <PageLayout title="Record cash flow">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet</FormLabel>
                <Select
                  onValueChange={value =>
                    field.onChange(walletsQuery.data?.data.find(w => w.id === value))
                  }
                  defaultValue={field.value?.id}
                  disabled={walletsQuery.isPending || hasNoWallets}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          hasNoWallets
                            ? "You have no wallets. Create a wallet first"
                            : "Choose a wallet"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {walletsQuery.data?.data.map(wallet => (
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
                      <SelectValue placeholder="Choose a record type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">INCOME</SelectItem>
                    <SelectItem value="EXPENSE">EXPENSE</SelectItem>
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
                        variant={"outline"}
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
                <FormDescription>
                  You can choose the desired date of record. The default is today, when you open
                  this page.
                </FormDescription>
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

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    autoComplete="off"
                    placeholder="I'm using or getting this money for . . ."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {recordItems.fields.length > 0
            ? recordItems.fields.map((recordItem, recordItemIndex) => (
                <div className="space-y-4 rounded-lg border border-dashed p-4" key={recordItem.id}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-medium">Record {recordItemIndex + 1}</h2>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => recordItems.remove(recordItemIndex)}
                    >
                      <Trash2Icon />
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

                  <FormField
                    control={form.control}
                    name={`items.${recordItemIndex}.note`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea
                            autoComplete="off"
                            placeholder="I'm using or getting this money for . . ."
                            {...field}
                          />
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
            onClick={() => recordItems.append({ amount: 0, note: "" })}
          >
            <PlusIcon /> Split record
          </Button>

          <TotalRecordsAmount
            control={form.control}
            setValue={form.setValue}
            errors={form.formState.errors}
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              disabled={createRecordMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" isLoading={createRecordMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
