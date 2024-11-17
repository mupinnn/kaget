import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const walletsFormSchema = z.object({
  name: z.string().min(5),
});

export function WalletsFormPage() {
  const form = useForm<z.infer<typeof walletsFormSchema>>({
    resolver: zodResolver(walletsFormSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof walletsFormSchema>) {
    console.log("form values: ", values);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Create new wallet</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g, Mighty Bank Account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Save</Button>
        </form>
      </Form>
    </div>
  );
}
