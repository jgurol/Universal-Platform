
import { CheckCircle, XCircle, Mail } from "lucide-react";

interface EmailStatusIndicatorProps {
  emailStatus: 'idle' | 'success' | 'error';
}

export const EmailStatusIndicator = ({ emailStatus }: EmailStatusIndicatorProps) => {
  const getStatusIcon = () => {
    if (emailStatus === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (emailStatus === 'error') return <XCircle className="w-5 h-5 text-red-600" />;
    return <Mail className="w-5 h-5 text-blue-600" />;
  };

  const getStatusText = () => {
    if (emailStatus === 'success') return <span className="text-sm font-normal text-green-600 ml-2">✓ Sent!</span>;
    if (emailStatus === 'error') return <span className="text-sm font-normal text-red-600 ml-2">✗ Failed</span>;
    return null;
  };

  return (
    <>
      {getStatusIcon()}
      Email Quote to Customer
      {getStatusText()}
    </>
  );
};
