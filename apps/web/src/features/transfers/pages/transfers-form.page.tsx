import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import CurrencyInput from "react-currency-input-field";
import { useForm } from "react-hook-form";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/utils/common.util";
import { useCreateTransferMutation } from "../data/transfers.mutations";
import { type CreateTransferForm, CreateTransferFormSchema } from "../data/transfers.schemas";

export function TransfersFormPage() {
  const navigate = useNavigate();
  const form = useForm<CreateTransferForm>({
    resolver: zodResolver(CreateTransferFormSchema),
  });
  const walletsQuery = useWalletsQuery();
  const createTransferMutation = useCreateTransferMutation();

  const hasNoWallets = (walletsQuery.data?.length ?? 0) === 0;
  const selectedSourceWallet = form.watch("source");

  const onSubmit = (values: CreateTransferForm) => {
    createTransferMutation.mutate(values, {
      async onSuccess() {
        await navigate({ to: "/transfers" });
      },
    });
  };

  if (walletsQuery.isPending) {
    return (
      <PageLayout title="Transfer" subtitle="Move money from one wallet to another on this device.">
        <div className="max-w-lg space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (walletsQuery.isError) {
    return (
      <PageLayout title="Transfer" subtitle="Move money from one wallet to another on this device.">
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
    <PageLayout title="Transfer" subtitle="Move money from one wallet to another on this device.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source wallet</FormLabel>
                <Select
                  value={field.value?.id}
                  disabled={hasNoWallets}
                  onValueChange={value => {
                    field.onChange(walletsQuery.data?.find(w => w.id === value));
                    form.resetField("destination");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          hasNoWallets ? "Create a wallet first" : "Choose a source wallet"
                        }
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
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination wallet</FormLabel>
                <Select
                  value={field.value?.id}
                  key={field.value?.id}
                  disabled={hasNoWallets || !selectedSourceWallet}
                  onValueChange={value =>
                    field.onChange(walletsQuery.data?.find(w => w.id === value))
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedSourceWallet
                            ? "Choose a source wallet first"
                            : "Choose a destination wallet"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(walletsQuery.data ?? [])
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
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee</FormLabel>
                <FormControl>
                  <CurrencyInput
                    autoComplete="off"
                    placeholder="e.g. 2.500"
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
                <FormDescription>
                  Optional. Leave empty when there is no transfer fee.
                </FormDescription>
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
                  <Textarea autoComplete="off" placeholder="Why you moved this money…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              size="sm"
              disabled={createTransferMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" size="sm" isLoading={createTransferMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
