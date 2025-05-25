
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

  // Load email status from database when component mounts
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('email_status, email_opened, email_open_count')
          .eq('id', quoteId)
          .single();

        if (!error && data) {
          if (data.email_status) {
            setEmailStatus(data.email_status as 'idle' | 'success' | 'error');
          }
          setEmailOpened(data.email_opened || false);
          setEmailOpenCount(data.email_open_count || 0);
        }
      } catch (err) {
        console.error('Error loading email status:', err);
      }
    };

    loadEmailStatus();
  }, [quoteId]);

  const getEmailIcon = () => {
    if (emailStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (emailStatus === 'error') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Mail className="w-4 h-4" />;
  };

  const getEmailButtonClass = () => {
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

  return (
    <div className="relative">
      <Button 
        variant={emailStatus !== 'idle' ? 'outline' : 'ghost'}
        size="sm" 
        className={`h-8 w-8 p-0 transition-all duration-500 border ${getEmailButtonClass()}`}
        onClick={onEmailClick}
        title={emailStatus === 'success' ? 'Email sent successfully!' : emailStatus === 'error' ? 'Email failed to send' : 'Email Quote'}
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
