import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
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
import { CreateWalletSchema, CreateWallet } from "../data/wallets.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateWalletMutation } from "../data/wallets.mutations";

export function WalletsFormPage() {
  const form = useForm<CreateWallet>({
    resolver: zodResolver(CreateWalletSchema),
    defaultValues: {
      name: "",
      initial_balance: 0,
    },
  });
  const createWalletMutation = useCreateWalletMutation();

  function onSubmit(values: CreateWallet) {
    createWalletMutation.mutate(values);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Create new wallet</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="e.g., Mighty Bank Account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a wallet type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="DIGITAL">DIGITAL</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  You can separate your cash or digital (bank account) wallet. Just like in the real
                  world.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initial_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial balance</FormLabel>
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

          <div className="flex items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              disabled={createWalletMutation.isPending}
            >
              <Link to="/wallets">Back</Link>
            </Button>
            <Button type="submit" isLoading={createWalletMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
