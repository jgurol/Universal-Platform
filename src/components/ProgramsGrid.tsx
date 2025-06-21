
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Search, DollarSign, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Program {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
  adminOnly?: boolean;
}

const programs: Program[] = [
  {
    id: "deal-registration",
    title: "Deal Registration",
    description: "Register and track your sales opportunities",
    icon: Target,
    route: "/deal-registration",
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    id: "circuit-quotes",
    title: "Circuit Quotes",
    description: "Research and compare carrier pricing before quoting",
    icon: Search,
    route: "/circuit-quotes",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    id: "quoting",
    title: "Quoting System",
    description: "Create and manage quotes for clients",
    icon: FileText,
    route: "/quoting-system",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    id: "circuit",
    title: "Circuit Progress Tracking",
    description: "Monitor circuit installation and progress",
    icon: Zap,
    route: "/circuit-tracking",
    color: "bg-orange-500 hover:bg-orange-600",
    adminOnly: true
  },
  {
    id: "commissions",
    title: "Track Commissions",
    description: "Track your client payments & commissions",
    icon: DollarSign,
    route: "/billing",
    color: "bg-emerald-500 hover:bg-emerald-600",
    adminOnly: true
  }
];

export const ProgramsGrid = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {programs.map((program) => {
          const IconComponent = program.icon;
          const isDisabled = program.adminOnly && !isAdmin;
          
          const cardContent = (
            <Card className={`bg-white shadow-lg border-0 transition-all duration-300 h-full ${
              isDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-xl cursor-pointer transform hover:scale-105'
            }`}>
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full ${
                  isDisabled ? 'bg-gray-400' : program.color
                } flex items-center justify-center mb-4 transition-all duration-300 ${
                  !isDisabled ? 'group-hover:scale-110' : ''
                }`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <CardTitle className={`text-lg font-semibold transition-colors ${
                  isDisabled 
                    ? 'text-gray-400' 
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className={`text-center text-sm ${
                  isDisabled ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {program.description}
                </CardDescription>
              </CardContent>
            </Card>
          );

          if (isDisabled) {
            return (
              <div key={program.id}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link key={program.id} to={program.route} className="group">
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
