import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define the schema for the waitlist form
const waitlistFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

export default function WaitlistSection() {
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
    },
  });

  // Handle form submission with React Query
  const mutation = useMutation({
    mutationFn: async (values: WaitlistFormValues) => {
      return await apiRequest("POST", "/api/waitlist", values);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Success!",
        description:
          "You've been added to our waitlist! Check your email for a confirmation message.",
        variant: "default",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: WaitlistFormValues) => {
    mutation.mutate(values);
  };

  return (
    <section
      id="waitlist"
      className="py-20 px-4 bg-gradient-to-br from-primary to-primary-700 text-white section-fade-in"
    >
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Exclusive Waitlist
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Be among the first to experience our platform when we launch. Early
            access members will receive special benefits and pricing.
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-xl max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="text-gray-800 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@example.com"
                        type="email"
                        {...field}
                        className="text-gray-800 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Company (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Company"
                        {...field}
                        className="text-gray-800 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="button-cta w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-lg shadow-md transition-all"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </Button>

              <p className="text-center text-gray-500 text-sm">
                By joining, you agree to our
                <a href="#" className="text-primary hover:underline ml-1">
                  Terms of Service
                </a>{" "}
                and
                <a href="#" className="text-primary hover:underline ml-1">
                  Privacy Policy
                </a>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
