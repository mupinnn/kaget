import { useState } from "react";
import { BadgeCheckIcon, ChevronsUpDownIcon, CheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { Settings, SettingsSchema } from "@/features/settings/data/settings.schema";
import { cn } from "@/libs/utils.lib";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";

const currencies = Intl.supportedValuesOf("currency");
const features = [
  {
    title: "Wallets",
    description: "Manage your “wallet” in a way like your real-life wallet. Split it as you need.",
  },
  {
    title: "Budgets",
    description:
      "Need to allocate money for a specific occasion? Use a budget! KaGet will cut your wallet balance when start budgeting, making it easy to control your spending.",
  },
  {
    title: "Offline & Fully client-side",
    description:
      "Access it anytime even without an internet connection. All your data is not going anywhere but your device.",
  },
];

function CurrencyList({
  value,
  setOpen,
  setSelectedCurrency,
}: {
  value: string;
  setOpen: (open: boolean) => void;
  setSelectedCurrency: (status: string) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Filter currency . . ." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {currencies.map(currency => (
            <CommandItem
              key={currency}
              value={currency}
              onSelect={value => {
                setSelectedCurrency(value);
                setOpen(false);
              }}
            >
              {currency}
              {currency === value && <CheckIcon className="ml-auto" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function OnboardingIndexPage() {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [balancePreview, setBalancePreview] = useState<string | undefined>("1000");

  const isMobile = useIsMobile();
  const form = useForm<Settings>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      currency: "IDR",
    },
  });

  function onSubmit(values: Settings) {
    console.log(values);
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-1 flex-col gap-4 p-4">
      <header className="space-y-1">
        <Badge variant="outline">Onboarding</Badge>
        <h1 className="text-2xl">
          Welcome to <br /> <span className="font-bold">KaGet: Kawan Budget!</span>
        </h1>
        <p className="text-muted-foreground">
          A fully offline web-based budgeting app that meets your needs.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Features Overview</h2>
        <div className="space-y-4">
          {features.map(feature => (
            <article key={feature.title}>
              <h3 className="inline-flex items-center gap-1 text-lg font-medium">
                <BadgeCheckIcon className="fill-primary" /> {feature.title}
              </h3>
              <p className="text-sm">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <p>Before using the app, you need to know a few things:</p>
        <ol className="list-disc space-y-2 pl-4">
          <li>
            Numbers are formatted based on your browser&apos;s language (locale) settings and
            selected currency code below.
          </li>
          <li>
            The locale is standardized via BCP 47 language tag. Your current browser&apos;s locale
            is: <code>{window.navigator.language}</code>
          </li>
          <li>If you have multiple locales, the first locale on the list will be used</li>
          <li>Currency codes below is using ISO 4217 currency codes standard.</li>
        </ol>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Currency</FormLabel>
                  {isMobile ? (
                    <Drawer open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
                      <DrawerTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ?? "Select currency . . ."}
                            <ChevronsUpDownIcon className="opacity-50" />
                          </Button>
                        </FormControl>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerTitle className="hidden" />
                        <div className="mt-4 border-t">
                          <CurrencyList
                            value={field.value}
                            setOpen={setIsCurrencyOpen}
                            setSelectedCurrency={value => {
                              form.setValue("currency", value);
                            }}
                          />
                        </div>
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <Popover open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ?? "Select currency . . ."}
                            <ChevronsUpDownIcon className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)]">
                        <CurrencyList
                          value={field.value}
                          setOpen={setIsCurrencyOpen}
                          setSelectedCurrency={value => {
                            form.setValue("currency", value);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormDescription>Selected currency can not be changed later.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Sample balance</FormLabel>
              <CurrencyInput
                placeholder="e.g, 100"
                value={balancePreview}
                onValueChange={value => setBalancePreview(value)}
                autoComplete="off"
                allowNegativeValue={false}
                inputMode="numeric"
                customInput={Input}
              />
            </FormItem>

            <Card>
              <CardHeader>
                <CardTitle>Balance</CardTitle>
                <CardDescription>Example of the formatted balance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(balancePreview ?? 0), {
                    currency: form.watch("currency"),
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date</CardTitle>
                <CardDescription>Example of the formatted date</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatDate(new Date(), { dateStyle: "full", timeStyle: "long" })}
                </p>
              </CardContent>
            </Card>

            <Button className="w-full">Start budgeting!</Button>
          </form>
        </Form>
      </section>
    </main>
  );
}
