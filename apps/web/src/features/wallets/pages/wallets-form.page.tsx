import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import CurrencyInput from "react-currency-input-field";
import { useForm } from "react-hook-form";
import { match, P } from "ts-pattern";
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
import { useCreateWalletMutation, useUpdateWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";
import {
  type CreateWallet,
  createWalletSchema,
  type UpdateWallet,
  updateWalletSchema,
  WALLET_TYPE_LABEL,
} from "../data/wallets.schemas";

export function WalletsFormPage() {
  const { walletId } = useParams({ strict: false });
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const form = useForm<CreateWallet | UpdateWallet>({
    resolver: walletId ? zodResolver(updateWalletSchema) : zodResolver(createWalletSchema),
    values: walletId ? { name: walletDetailQuery.data?.name ?? "" } : undefined,
    defaultValues: {
      name: "",
      initial_balance: 0,
    },
  });
  const navigate = useNavigate();
  const createWalletMutation = useCreateWalletMutation();
  const updateWalletMutation = useUpdateWalletMutation();
  const isSaving = createWalletMutation.isPending || updateWalletMutation.isPending;

  function onSubmit(values: CreateWallet | UpdateWallet) {
    if (walletId) {
      updateWalletMutation.mutate(
        { walletId, data: { name: values.name } },
        {
          async onSuccess() {
            await navigate({ to: "/wallets/$walletId", params: { walletId } });
          },
        }
      );
    } else {
      createWalletMutation.mutate(values as CreateWallet, {
        async onSuccess() {
          await navigate({ to: "/wallets" });
        },
      });
    }
  }

  return (
    <PageLayout
      title={match(walletId)
        .with(P.string, () => `Edit ${walletDetailQuery.data?.name ?? "wallet"}`)
        .otherwise(() => "Create wallet")}
      subtitle={match(walletId)
        .with(P.string, () => "Rename this money holder. Balance stays as recorded.")
        .otherwise(() => "A wallet holds money you control on this device.")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="e.g. BCA Checking" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!walletId ? (
            <>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Cash or Digital" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">{WALLET_TYPE_LABEL.CASH}</SelectItem>
                        <SelectItem value="DIGITAL">{WALLET_TYPE_LABEL.DIGITAL}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Cash is physical money; Digital covers bank and e-wallet balances.
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
                    <FormDescription>
                      Opening amount when this wallet starts on this device.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              size="sm"
              disabled={isSaving}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
