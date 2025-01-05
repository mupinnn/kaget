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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { type CreateTransfer, CreateTransferSchema } from "../data/transfers.schemas";
import { useCreateTransferMutation } from "../data/transfers.mutations";

export function TransfersFormPage() {
  const form = useForm<CreateTransfer>({
    resolver: zodResolver(CreateTransferSchema),
  });
  const walletsQuery = useWalletsQuery();
  const createTransferMutation = useCreateTransferMutation();

  const hasNoWallets = walletsQuery.data?.data.length === 0;
  const selectedSourceWallet = form.watch("source");

  const onSubmit = (values: CreateTransfer) => {
    createTransferMutation.mutate(values);
  };

  return (
    <PageLayout title="Transfer">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source wallet</FormLabel>
                <Select
                  value={field.value?.id}
                  disabled={walletsQuery.isPending || hasNoWallets}
                  onValueChange={value => {
                    field.onChange(walletsQuery.data?.data.find(w => w.id === value));
                    form.resetField("destination");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          hasNoWallets
                            ? "You have no wallets. Create a wallet first"
                            : "Choose a source wallet"
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
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination wallet</FormLabel>
                <Select
                  value={field.value?.id}
                  key={field.value?.id}
                  disabled={walletsQuery.isPending || hasNoWallets || !selectedSourceWallet}
                  onValueChange={value =>
                    field.onChange(walletsQuery.data?.data.find(w => w.id === value))
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          hasNoWallets
                            ? "You have no wallets. Create a wallet first"
                            : "Choose a destination wallet"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {walletsQuery.data?.data
                      .filter(wallet => wallet.id !== selectedSourceWallet?.id)
                      .map(wallet => (
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

          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee</FormLabel>
                <FormControl>
                  <CurrencyInput
                    autoComplete="off"
                    placeholder="e.g, 2.500"
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
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    autoComplete="off"
                    placeholder="I'm transferring this for . . ."
                    {...field}
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
              disabled={createTransferMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" isLoading={createTransferMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
