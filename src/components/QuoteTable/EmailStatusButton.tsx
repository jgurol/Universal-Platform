
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailStatusButtonProps {
  quoteId: string;
  onEmailClick: () => void;
}

export const EmailStatusButton = ({ quoteId, onEmailClick }: EmailStatusButtonProps) => {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailOpened, setEmailOpened] = useState(false);
  const [emailOpenCount, setEmailOpenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load email status from database when component mounts or quoteId changes
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('quotes')
          .select('email_status, email_opened, email_open_count')
          .eq('id', quoteId)
          .single();

        if (!error && data) {
          console.log('EmailStatusButton - Loaded email status for quote:', quoteId, data);
          if (data.email_status) {
            setEmailStatus(data.email_status as 'idle' | 'success' | 'error');
          }
          setEmailOpened(data.email_opened || false);
          setEmailOpenCount(data.email_open_count || 0);
        } else {
          console.warn('EmailStatusButton - No data or error for quote:', quoteId, error);
        }
      } catch (err) {
        console.error('Error loading email status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (quoteId) {
      loadEmailStatus();
    }
  }, [quoteId]);

  // Set up real-time subscription to listen for quote updates
  useEffect(() => {
    if (!quoteId) return;

    const channel = supabase
      .channel(`quote-email-status-${quoteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `id=eq.${quoteId}`
        },
        (payload) => {
          console.log('EmailStatusButton - Real-time update received:', payload);
          const newData = payload.new as any;
          if (newData.email_status) {
            setEmailStatus(newData.email_status);
          }
          if (newData.email_opened !== undefined) {
            setEmailOpened(newData.email_opened);
          }
          if (newData.email_open_count !== undefined) {
            setEmailOpenCount(newData.email_open_count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quoteId]);

  const getEmailIcon = () => {
    if (isLoading) return <Mail className="w-4 h-4 animate-pulse" />;
    if (emailStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (emailStatus === 'error') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Mail className="w-4 h-4" />;
  };

  const getEmailButtonClass = () => {
    if (isLoading) return 'text-gray-400 hover:text-gray-500';
    if (emailStatus === 'success') return 'text-green-600 hover:text-green-700 bg-green-50 border-green-200';
    if (emailStatus === 'error') return 'text-red-600 hover:text-red-700 bg-red-50 border-red-200';
    return 'text-gray-500 hover:text-blue-600';
  };

  const getEmailOpenIndicator = () => {
    if (emailOpened && emailStatus === 'success') {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600" title={`Email opened ${emailOpenCount} time(s)`}>
          <Eye className="w-3 h-3" />
          {emailOpenCount > 1 && <span>{emailOpenCount}</span>}
        </div>
      );
    }
    return null;
  };

  const getButtonTitle = () => {
    if (isLoading) return 'Loading email status...';
    if (emailStatus === 'success') return 'Email sent successfully!';
    if (emailStatus === 'error') return 'Email failed to send';
    return 'Email Quote';
  };

  return (
    <div className="relative">
      <Button 
        variant={emailStatus !== 'idle' ? 'outline' : 'ghost'}
        size="sm" 
        className={`h-8 w-8 p-0 transition-all duration-500 border ${getEmailButtonClass()}`}
        onClick={onEmailClick}
        title={getButtonTitle()}
        disabled={isLoading}
      >
        {getEmailIcon()}
      </Button>
      {getEmailOpenIndicator() && (
        <div className="absolute -top-1 -right-1">
          {getEmailOpenIndicator()}
        </div>
      )}
    </div>
  );
};
