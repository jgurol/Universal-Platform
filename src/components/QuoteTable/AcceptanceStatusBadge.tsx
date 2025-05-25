
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface AcceptanceStatusBadgeProps {
  status?: 'pending' | 'accepted' | 'declined';
  acceptedBy?: string;
  acceptedAt?: string;
}

export const AcceptanceStatusBadge = ({ 
  status = 'pending', 
  acceptedBy, 
  acceptedAt 
}: AcceptanceStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'accepted':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'Accepted',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'declined':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          text: 'Declined',
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-3 h-3" />,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="space-y-1">
      <Badge 
        variant={config.variant} 
        className={`flex items-center gap-1 ${config.className}`}
      >
        {config.icon}
        {config.text}
      </Badge>
      {status === 'accepted' && acceptedBy && (
        <div className="text-xs text-gray-500">
          <p>By: {acceptedBy}</p>
          {acceptedAt && (
            <p>On: {new Date(acceptedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
};
