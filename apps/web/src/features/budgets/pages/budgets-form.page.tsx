import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import {
  type UseFieldArrayRemove,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { parseAmount } from "@/utils/amount.util";
import { formatCurrency } from "@/utils/common.util";
import { useCreateBudgetMutation } from "../data/budgets.mutations";
import { type CreateBudget, CreateBudgetSchema } from "../data/budgets.schemas";

function BudgetFormWalletRemainingBalance({ id, balance }: Wallet) {
  const formContext = useFormContext<CreateBudget>();
  const budgetItems = useWatch({ control: formContext.control, name: "budgets" });
  const usedBalance = budgetItems
    .filter(budget => budget?.wallet?.id === id)
    .reduce((acc, curr) => acc + Number(curr.balance ?? 0), 0);
  const remainingBalance = parseAmount(balance) - usedBalance;

  if (remainingBalance >= 0) {
    return `(Remaining: ${formatCurrency(remainingBalance)})`;
  }

  return null;
}

function BudgetForm({
  index,
  remove,
  walletOptions,
  canRemove,
}: {
  index: number;
  remove: UseFieldArrayRemove;
  walletOptions: Wallet[];
  canRemove: boolean;
}) {
  const formContext = useFormContext<CreateBudget>();
  const [name, wallet] = useWatch({
    control: formContext.control,
    name: [`budgets.${index}.name`, `budgets.${index}.wallet`],
  });

  const hasNoWallets = walletOptions.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate font-medium text-base tracking-tight">
          {name ? name : `Envelope ${index + 1}`}
        </h2>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={() => remove(index)}
          >
            <Trash2Icon />
            <span className="sr-only">Remove envelope</span>
          </Button>
        ) : null}
      </div>

      <FormField
        control={formContext.control}
        name={`budgets.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input autoComplete="off" placeholder="e.g. Groceries" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={formContext.control}
        name={`budgets.${index}.wallet`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wallet</FormLabel>
            <Select
              onValueChange={value => field.onChange(walletOptions.find(w => w.id === value))}
              disabled={hasNoWallets}
            >
              <FormControl>
                <SelectTrigger data-testid={`${field.name}-trigger`}>
                  <SelectValue
                    placeholder={
                      hasNoWallets ? "Create a wallet first" : "Choose the wallet to fund from"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {walletOptions.map(walletOption => (
                  <SelectItem
                    data-testid={`${field.name}-item`}
                    key={walletOption.id}
                    value={walletOption.id}
                    className="w-full"
                    disabled={parseAmount(walletOption.balance) === 0}
                  >
                    {walletOption.name} - {formatCurrency(walletOption.balance)}{" "}
                    <BudgetFormWalletRemainingBalance {...walletOption} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {wallet ? (
        <FormField
          control={formContext.control}
          name={`budgets.${index}.balance`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Balance</FormLabel>
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
    </div>
  );
}

function AllocationSummaryBody({
  budgetsSummary,
  walletOptions,
}: {
  budgetsSummary: [string, CreateBudget["budgets"]][];
  walletOptions: Wallet[];
}) {
  return (
    <div className="space-y-3">
      {budgetsSummary.map(([walletId, budgets]) => {
        const matchedWallet = walletOptions.find(w => w.id === walletId);
        const usedBalance = budgets.reduce((a, b) => a + Number(b.balance ?? 0), 0);
        const usedPercentage = (usedBalance / parseAmount(matchedWallet?.balance ?? "0")) * 100;

        return (
          <div className="space-y-2" key={walletId}>
            <h3 className="font-semibold text-sm">{matchedWallet?.name}</h3>
            {budgets.map((budget, budgetIndex) => (
              <div
                className="flex items-center justify-between gap-2"
                key={`${walletId}-${budgetIndex}`}
              >
                <p className="text-sm">{budget.name}</p>
                <p className="font-medium text-sm tabular-nums">{formatCurrency(budget.balance)}</p>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex justify-between gap-2">
              <p className="text-sm">Total</p>
              <p className="flex flex-col gap-0.5 text-right font-medium text-sm">
                <span className="tabular-nums">{formatCurrency(usedBalance)}</span>
                <span className="text-muted-foreground text-xs">
                  {usedPercentage.toFixed()}% from {formatCurrency(matchedWallet?.balance ?? 0)}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BudgetsFormPage() {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const isMobile = useIsMobile();
  const form = useForm<CreateBudget>({
    resolver: zodResolver(CreateBudgetSchema),
    defaultValues: {
      budgets: [{ name: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "budgets" });
  const walletsQuery = useWalletsQuery();
  const createBudgetMutation = useCreateBudgetMutation();
  const navigate = useNavigate();

  if (walletsQuery.isPending) {
    return (
      <PageLayout title="Allocate money" subtitle="Move funds from wallets into envelopes.">
        <div className="max-w-lg space-y-3">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-9 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (walletsQuery.isError) {
    return (
      <PageLayout title="Allocate money" subtitle="Move funds from wallets into envelopes.">
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

  const walletOptions = walletsQuery.data ?? [];
  const budgetsSummary = Object.entries(
    form.watch("budgets").reduce<Record<string, CreateBudget["budgets"]>>((group, budget) => {
      if (budget.wallet) {
        group[budget.wallet.id] = group[budget.wallet.id] ?? [];
        group[budget.wallet.id].push(budget);
      }

      return group;
    }, {})
  );

  const onSubmit = (values: CreateBudget) => {
    createBudgetMutation.mutate(values, {
      async onSuccess() {
        await navigate({ to: "/budgets" });
      },
    });
  };

  const onSummarize = async () => {
    const isFormValid = await form.trigger();
    if (isFormValid) setIsSummaryOpen(true);
  };

  const summaryBody = (
    <AllocationSummaryBody budgetsSummary={budgetsSummary} walletOptions={walletOptions} />
  );

  return (
    <PageLayout
      title="Allocate money"
      subtitle="Move funds from wallets into envelopes on this device."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-lg space-y-3"
          id="budget-form"
        >
          {fields.map((budget, budgetIndex) => (
            <BudgetForm
              key={budget.id}
              index={budgetIndex}
              remove={remove}
              walletOptions={walletOptions}
              canRemove={fields.length > 1}
            />
          ))}

          <Button
            type="button"
            className="w-full"
            variant="secondary"
            size="sm"
            onClick={() => {
              // @ts-expect-error: https://github.com/orgs/react-hook-form/discussions/10211
              append({ name: "" });
            }}
          >
            <PlusIcon /> Add allocation
          </Button>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button asChild variant="outline" className="no-underline" size="sm">
              <Link to="..">Back</Link>
            </Button>
            <Button onClick={onSummarize} type="button" size="sm">
              Summarize
            </Button>
          </div>

          {isMobile ? (
            <Sheet open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
              <SheetContent side="bottom" className="max-h-svh overflow-auto">
                <SheetHeader>
                  <SheetTitle>Budget Allocation Summary</SheetTitle>
                  <SheetDescription>
                    Review envelopes before moving money from wallets.
                  </SheetDescription>
                </SheetHeader>
                <div className="my-4">{summaryBody}</div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button
                      type="submit"
                      form="budget-form"
                      size="sm"
                      isLoading={createBudgetMutation.isPending}
                    >
                      Allocate!
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
              <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Budget Allocation Summary</DialogTitle>
                  <DialogDescription>
                    Review envelopes before moving money from wallets.
                  </DialogDescription>
                </DialogHeader>
                {summaryBody}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="submit"
                      form="budget-form"
                      size="sm"
                      isLoading={createBudgetMutation.isPending}
                    >
                      Allocate!
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </form>
      </Form>
    </PageLayout>
  );
}
