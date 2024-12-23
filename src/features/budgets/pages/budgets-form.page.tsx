import { Link } from "@tanstack/react-router";
import {
  useForm,
  useFieldArray,
  useFormContext,
  UseFieldArrayRemove,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { Trash2Icon, PlusIcon } from "lucide-react";
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
import { Wallet } from "@/features/wallets/data/wallets.schema";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { CreateBudget, CreateBudgetSchema } from "../data/budgets.schema";
import { useCreateBudgetMutation } from "../data/budgets.mutations";

function BudgetForm({
  index,
  remove,
  walletOptions,
}: {
  index: number;
  remove: UseFieldArrayRemove;
  walletOptions: Wallet[];
}) {
  const formContext = useFormContext<CreateBudget>();
  const [name, wallet] = useWatch({
    control: formContext.control,
    name: [`budgets.${index}.name`, `budgets.${index}.wallet`],
  });

  const hasNoWallets = walletOptions.length === 0;

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">{name ? name : `Budget ${index + 1}`}</h2>
        <Button variant="destructive" size="icon" onClick={() => remove(index)}>
          <Trash2Icon />
        </Button>
      </div>

      <FormField
        control={formContext.control}
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
          control={formContext.control}
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
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "budgets" });
  const walletsQuery = useWalletsQuery();
  const createBudgetMutation = useCreateBudgetMutation();

  if (walletsQuery.isPending) return <p>Loading . . .</p>;
  if (walletsQuery.isError) return <p>An error occured: {walletsQuery.error.message}</p>;

  const walletOptions = walletsQuery.data.data;

  const onSubmit = (values: CreateBudget) => {
    createBudgetMutation.mutate(values);
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
              walletOptions={walletOptions}
            />
          ))}

          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={() => {
              // @ts-expect-error: https://github.com/orgs/react-hook-form/discussions/10211
              append({ name: "" });
            }}
          >
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
