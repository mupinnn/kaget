import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectSingleEventHandler } from "react-day-picker";
import { CalendarIcon, PlusIcon } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import { CreateRecordSchema, CreateRecord } from "@/features/records/data/records.schemas";
import { useCreateRecordMutation } from "@/features/records/data/records.mutations";
import { TotalRecordsAmount } from "@/features/records/pages/records-form.page";
import { TransformedBudgetWithRelations } from "../data/budgets.schemas";

interface BudgetCreateRecordsDialogProps {
  trigger: React.ReactNode;
  budgetDetail: TransformedBudgetWithRelations;
}

export function BudgetCreateRecordsDialog({
  trigger,
  budgetDetail,
}: BudgetCreateRecordsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateRecord>({
    resolver: zodResolver(CreateRecordSchema),
    defaultValues: {
      note: "",
      dor: new Date(),
      items: [],
      record_type: "EXPENSE",
      source: {
        id: budgetDetail.id,
        name: budgetDetail.name,
        balance: budgetDetail.remaining_balance,
        total_balance: Math.abs(budgetDetail.used_balance + budgetDetail.remaining_balance),
        wallet_id: budgetDetail.wallet_id,
        created_at: budgetDetail.created_at,
        updated_at: budgetDetail.updated_at,
        archived_at: budgetDetail.archived_at,
      },
    },
  });
  const recordItems = useFieldArray({ control: form.control, name: "items" });
  const createRecordMutation = useCreateRecordMutation();

  const watchDor = form.watch("dor");
  const dorTimeValue = `${new Date(watchDor).getHours()}:${new Date(watchDor).getMinutes()}`;

  function onSubmit(values: CreateRecord) {
    createRecordMutation.mutate(values, {
      onSuccess() {
        setIsOpen(false);
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

  function onOpenChange(open: boolean) {
    setIsOpen(open);
    form.reset();
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-svh overflow-auto">
        <SheetHeader>
          <SheetTitle>Use budget</SheetTitle>
          <SheetDescription>Records your budget money usage</SheetDescription>
        </SheetHeader>
        <div className="my-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              id="budget-records-form"
              className="space-y-4"
            >
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
                        <Input
                          type="time"
                          defaultValue={dorTimeValue}
                          onChange={handleDorTimeChange}
                        />
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
                    <div
                      className="space-y-4 rounded-lg border border-dashed p-4"
                      key={recordItem.id}
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-medium">Record {recordItemIndex + 1}</h2>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => recordItems.remove(recordItemIndex)}
                        >
                          Delete
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
            </form>
          </Form>
        </div>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={createRecordMutation.isPending}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="budget-records-form"
            isLoading={createRecordMutation.isPending}
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
