
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Agent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

interface AddUserDialogProps {
  agents?: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const formSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "agent"], {
    required_error: "Please select a role",
  }),
  associated_agent_id: z.string().nullable().optional(),
  send_welcome_email: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export const AddUserDialog = ({ 
  agents = [],
  open, 
  onOpenChange, 
  onUserAdded 
}: AddUserDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "agent",
      associated_agent_id: null,
      send_welcome_email: true,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      console.log('Calling create-user function with data:', data);
      
      // Call our edge function to create the user
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          associated_agent_id: data.associated_agent_id === "none" ? null : data.associated_agent_id,
          send_welcome_email: data.send_welcome_email,
        }
      });

      if (error) {
        console.error("Error from create-user function:", error);
        toast({
          title: "Failed to create user",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!result?.success) {
        console.error("Create user function returned error:", result?.error);
        toast({
          title: "Failed to create user",
          description: result?.error || "Unknown error occurred",
          variant: "destructive",
        });
        return;
      }

      console.log('User created successfully:', result);

      toast({
        title: "User created successfully",
        description: `${data.full_name} has been added to the system`,
      });

      onUserAdded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Exception creating user:", error);
      toast({
        title: "Creation error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. A temporary password will be generated and sent via email.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="add-admin" />
                        <FormLabel htmlFor="add-admin" className="cursor-pointer">Admin</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agent" id="add-agent" />
                        <FormLabel htmlFor="add-agent" className="cursor-pointer">Agent</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="associated_agent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associate with Salesperson</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a salesperson" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {agents.length > 0 ? (
                        agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {`${agent.first_name} ${agent.last_name} (${agent.company_name || 'No Company'})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-agents" disabled>
                          No salespersons available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="send_welcome_email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send welcome email</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Send an email with login instructions and temporary password
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
