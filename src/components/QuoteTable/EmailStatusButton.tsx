
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [emailOpenedAt, setEmailOpenedAt] = useState<string | null>(null);
  const [emailSentAt, setEmailSentAt] = useState<string | null>(null);

  // Load email status from database when component mounts
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('email_status, email_opened, email_open_count, email_opened_at, email_sent_at')
          .eq('id', quoteId)
          .single();

        if (!error && data) {
          if (data.email_status) {
            setEmailStatus(data.email_status as 'idle' | 'success' | 'error');
          }
          setEmailOpened(data.email_opened || false);
          setEmailOpenCount(data.email_open_count || 0);
          setEmailOpenedAt(data.email_opened_at);
          setEmailSentAt(data.email_sent_at);
        }
      } catch (err) {
        console.error('Error loading email status:', err);
      }
    };

    loadEmailStatus();
  }, [quoteId]);

  const getEmailIcon = () => {
    if (emailStatus === 'success') return <Mail className="w-4 h-4 text-green-600" />;
    if (emailStatus === 'error') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Mail className="w-4 h-4" />;
  };

  const getEmailButtonClass = () => {
    if (emailStatus === 'success') return 'text-green-600 hover:text-green-700 bg-green-50 border-green-200';
    if (emailStatus === 'error') return 'text-red-600 hover:text-red-700 bg-red-50 border-red-200';
    return 'text-gray-500 hover:text-blue-600';
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTooltipContent = () => {
    if (emailStatus === 'error') {
      return "Email failed to send";
    }
    
    if (emailStatus === 'success') {
      const sentDate = formatDateTime(emailSentAt);
      const openedDate = formatDateTime(emailOpenedAt);
      
      let content = `Email sent successfully`;
      if (sentDate) content += `\nSent: ${sentDate}`;
      
      if (emailOpened) {
        content += `\nOpened: ${emailOpenCount} time(s)`;
        if (openedDate) content += `\nLast opened: ${openedDate}`;
      } else {
        content += `\nNot yet opened`;
      }
      
      return content;
    }
    
    return "Email Quote";
  };

  return (
    <TooltipProvider>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={emailStatus !== 'idle' ? 'outline' : 'ghost'}
              size="sm" 
              className={`h-8 w-8 p-0 transition-all duration-500 border ${getEmailButtonClass()}`}
              onClick={onEmailClick}
            >
              {getEmailIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm whitespace-pre-line">
              {getTooltipContent()}
            </div>
          </TooltipContent>
        </Tooltip>
        
        {/* Badge count for email opens */}
        {emailOpened && emailOpenCount > 0 && emailStatus === 'success' && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white border-2 border-white"
          >
            {emailOpenCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};
