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
import { CreateBudgetSchema, CreateBudget } from "../data/budgets.schema";

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

  function onSubmit(values: CreateBudget) {
    console.log(values);
  }

  return (
    <PageLayout title="Allocate new budget">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="digital_wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digital wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a digital wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1391093">W</SelectItem>
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
              name="cash_wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a cash wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1391093">W</SelectItem>
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
          </div>

          <hr />

          <div className="space-y-4">
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
          </div>

          <hr />

          <Button type="button" className="w-full" onClick={() => console.log("breakdown")}>
            <PlusIcon /> Add budget breakdown
          </Button>

          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline" className="no-underline">
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
