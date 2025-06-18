
import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

interface UpdatePasswordFormProps {
  onUpdatePassword: (password: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  tokenError: string | null;
  isCheckingSession: boolean;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({
  onUpdatePassword,
  onCancel,
  isSubmitting,
  tokenError,
  isCheckingSession,
}) => {
  const { toast } = useToast();
  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check current user session to verify
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // Session check for debugging purposes only
    });
  }, [isCheckingSession, tokenError, isSubmitting]);

  const handleSubmit = async (values: UpdatePasswordFormValues) => {
    await onUpdatePassword(values.password);
  };

  if (isCheckingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Verifying your reset link...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Reset Link Error</AlertTitle>
          <AlertDescription className="mt-2">
            {tokenError}
          </AlertDescription>
        </Alert>
        
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>What to do next:</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go back to the login page</li>
              <li>Click "Forgot password?" again</li>
              <li>Enter your email to get a fresh reset link</li>
              <li>Check your email and click the new link immediately</li>
            </ol>
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
          >
            Back to Login
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Password Requirements</AlertTitle>
        <AlertDescription>
          Your new password must be at least 6 characters long.
        </AlertDescription>
      </Alert>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Form>
    </>
  );
};
