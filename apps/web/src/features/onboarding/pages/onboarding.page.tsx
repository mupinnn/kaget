import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateSettingsMutation } from "@/features/settings/data/settings.mutations";
import {
  type CreateSettings,
  currencyCodeBodySchema,
} from "@/features/settings/data/settings.schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/libs/utils.lib";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";

const currencies = Intl.supportedValuesOf("currency");

const features = [
  {
    title: "Wallets",
    description: "Mirror cash, bank, and e-wallets — split the way you actually hold money.",
  },
  {
    title: "Budgets",
    description:
      "Envelope allocation: money leaves a wallet into a budget so spending stays intentional.",
  },
  {
    title: "On this device",
    description:
      "Your ledger lives locally. Google Drive backup is optional later in Settings — no login to start.",
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
      <CommandInput
        placeholder="Filter currency . . ."
        data-testid="onboarding-currency-search-input"
      />
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
              data-testid={`onboarding-currency-item-${currency}`}
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

  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const form = useForm<CreateSettings>({
    resolver: zodResolver(currencyCodeBodySchema),
    defaultValues: {
      currencyCode: "IDR",
    },
  });
  const createSettingsMutation = useCreateSettingsMutation();
  const selectedCurrency = form.watch("currencyCode");

  function onSubmit(values: CreateSettings) {
    createSettingsMutation.mutate(values, {
      async onSuccess() {
        await navigate({ to: "/" });
      },
    });
  }

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--primary)_28%,transparent),_transparent_55%),linear-gradient(180deg,var(--secondary),var(--background)_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)] opacity-70"
      />

      <div className="relative mx-auto grid min-h-svh w-full max-w-5xl gap-10 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-12">
        <section className="fade-in slide-in-from-bottom-2 animate-in space-y-8 duration-500">
          <header className="space-y-4">
            <p className="inline-flex items-center gap-2 font-semibold text-sm tracking-wide">
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <WalletIcon className="size-4" aria-hidden />
              </span>
              <span className="text-foreground">KaGet</span>
            </p>
            <h1
              className="max-w-xl text-balance font-semibold text-3xl leading-tight tracking-tight sm:text-4xl"
              data-testid="onboarding-welcome-title"
            >
              Kawan Budget — envelopes on your device
            </h1>
            <p className="max-w-md text-base text-muted-foreground leading-relaxed">
              Pick a currency to start. No account wall: budgeting works offline; Drive backup stays
              optional in Settings.
            </p>
          </header>

          <ul className="hidden space-y-4 lg:block">
            {features.map(feature => (
              <li key={feature.title} className="max-w-md">
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fade-in slide-in-from-bottom-3 animate-in fill-mode-both delay-100 duration-500">
          <div className="rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="mb-5 space-y-1">
              <h2 className="font-semibold text-lg">Choose your currency</h2>
              <p className="text-muted-foreground text-sm">
                Amounts format with your browser locale (
                <code className="text-xs">{window.navigator.language}</code>
                ). Currency uses ISO 4217 codes and cannot be changed later.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Currency</FormLabel>
                      {isMobile ? (
                        <Drawer open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
                          <DrawerTrigger asChild>
                            <FormControl data-testid="onboarding-select-currency-trigger">
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
                                  form.setValue("currencyCode", value);
                                }}
                              />
                            </div>
                          </DrawerContent>
                        </Drawer>
                      ) : (
                        <Popover open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
                          <PopoverTrigger asChild>
                            <FormControl data-testid="onboarding-select-currency-trigger">
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
                          <PopoverContent className="w-(--radix-popover-trigger-width)">
                            <CurrencyList
                              value={field.value}
                              setOpen={setIsCurrencyOpen}
                              setSelectedCurrency={value => {
                                form.setValue("currencyCode", value);
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
                    data-testid="onboarding-sample-balance-input"
                    placeholder="e.g, 100"
                    value={balancePreview}
                    onValueChange={value => setBalancePreview(value)}
                    autoComplete="off"
                    allowNegativeValue={false}
                    inputMode="numeric"
                    customInput={Input}
                  />
                </FormItem>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-muted-foreground text-xs">Balance preview</p>
                    <p
                      className="mt-1 font-semibold text-base"
                      data-testid="onboarding-sample-balance-preview"
                    >
                      {formatCurrency(Number(balancePreview ?? 0), {
                        currency: selectedCurrency,
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-muted-foreground text-xs">Date preview</p>
                    <p
                      className="mt-1 font-semibold text-sm leading-snug"
                      data-testid="onboarding-sample-date-preview"
                    >
                      {formatDate(new Date(), { dateStyle: "full", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={createSettingsMutation.isPending}
                  data-testid="onboarding-createSettings-button"
                >
                  {createSettingsMutation.isPending ? "Saving…" : "Start budgeting!"}
                </Button>
              </form>
            </Form>
          </div>

          <ul className="mt-6 space-y-3 lg:hidden">
            {features.map(feature => (
              <li key={feature.title}>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
