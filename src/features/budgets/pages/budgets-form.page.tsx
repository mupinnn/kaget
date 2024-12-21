import { Link } from "@tanstack/react-router";
import { useForm, useFieldArray, Control, UseFieldArrayRemove, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { Trash2Icon, PlusIcon, GroupIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { Wallet } from "@/features/wallets/data/wallets.schema";
import { CreateBudget, CreateBudgetSchema } from "../data/budgets.schema";

function BudgetForm({
  control,
  index,
  remove,
  walletOptions,
}: {
  control: Control<CreateBudget>;
  index: number;
  remove: UseFieldArrayRemove;
  walletOptions: Wallet[];
}) {
  const [name, wallet] = useWatch({
    control,
    name: [`budgets.${index}.name`, `budgets.${index}.wallet`],
  });
  const budgetItems = useFieldArray({ control, name: `budgets.${index}.items` });
  const hasNoWallets = walletOptions.length === 0;

  const handleCreateBudgetGroup = () => {
    console.log("something");
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">{name ? name : `Budget ${index + 1}`}</h2>
        <Button variant="destructive" size="icon" onClick={() => remove(index)}>
          <Trash2Icon />
        </Button>
      </div>

      <FormField
        control={control}
        name={`budgets.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input autoComplete="off" placeholder="e.g., Gunpla and Hobbies" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {budgetItems.fields.length === 0 ? (
        <>
          <FormField
            control={control}
            name={`budgets.${index}.wallet`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet</FormLabel>
                <Select
                  onValueChange={value => field.onChange(walletOptions.find(w => w.id === value))}
                  disabled={hasNoWallets}
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
                    {walletOptions.map(wallet => (
                      <SelectItem
                        key={wallet.id}
                        value={wallet.id}
                        className="w-full"
                        disabled={wallet.balance === 0}
                      >
                        {wallet.name} - {formatCurrency(wallet.balance)}
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
              control={control}
              name={`budgets.${index}.balance`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
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
        </>
      ) : null}

      <Button
        type="button"
        className="w-full"
        variant="secondary"
        onClick={handleCreateBudgetGroup}
      >
        <GroupIcon /> Create budget group
      </Button>
    </div>
  );
}

export function BudgetsFormPage() {
  const form = useForm<CreateBudget>({
    resolver: zodResolver(CreateBudgetSchema),
    defaultValues: {
      budgets: [{ name: "" }],
    },
  });
  const { fields, remove } = useFieldArray({ control: form.control, name: "budgets" });
  const walletsQuery = useWalletsQuery();

  if (walletsQuery.isPending) return <p>Loading . . .</p>;
  if (walletsQuery.isError) return <p>An error occured: {walletsQuery.error.message}</p>;

  const walletOptions = walletsQuery.data.data;

  const onSubmit = (values: CreateBudget) => {
    console.log(values);
  };

  return (
    <PageLayout title="Allocate your money">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((budget, budgetIndex) => (
            <BudgetForm
              key={budget.id}
              index={budgetIndex}
              remove={remove}
              control={form.control}
              walletOptions={walletOptions}
            />
          ))}

          <Button type="button" className="w-full" variant="secondary">
            <PlusIcon /> Add allocation
          </Button>

          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline" className="no-underline">
              <Link to="..">Back</Link>
            </Button>
            <Button type="submit">Summarize</Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
