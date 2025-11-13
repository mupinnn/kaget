import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { match, P } from "ts-pattern";
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
import {
  CreateWalletSchema,
  type CreateWallet,
  type Wallet,
  UpdateWalletSchema,
} from "../data/wallets.schemas";
import { useCreateWalletMutation, useUpdateWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";

export function WalletsFormPage() {
  const { walletId } = useParams({ strict: false });
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const form = useForm<CreateWallet | Wallet>({
    resolver: walletId ? zodResolver(UpdateWalletSchema) : zodResolver(CreateWalletSchema),
    values: walletDetailQuery.data?.data,
    defaultValues: {
      name: "",
      initial_balance: 0,
    },
  });
  const navigate = useNavigate();
  const createWalletMutation = useCreateWalletMutation();
  const updateWalletMutation = useUpdateWalletMutation();

  function onSubmit(values: CreateWallet | Wallet) {
    if (walletId) {
      updateWalletMutation.mutate(
        { walletId, data: values },
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
        .with(P.string, () => `Update ${walletDetailQuery.data?.data.name} wallet`)
        .otherwise(() => "Create wallet")}
    >
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
                          <SelectValue placeholder="Choose a wallet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">CASH</SelectItem>
                        <SelectItem value="DIGITAL">DIGITAL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      You can separate your cash or digital (bank account) wallet. Just like in the
                      real world.
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
            </>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              className="no-underline"
              disabled={createWalletMutation.isPending}
            >
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit" isLoading={createWalletMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
