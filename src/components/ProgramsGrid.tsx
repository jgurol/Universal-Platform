
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Search, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface Program {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string; // Make route optional
  color: string;
}

const programs: Program[] = [
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
    color: "bg-orange-500 hover:bg-orange-600"
  },
  {
    id: "commissions",
    title: "Track Commissions",
    description: "Track your client payments & commissions",
    icon: DollarSign,
    // No route - placeholder card
    color: "bg-green-500 hover:bg-green-600"
  }
];

export const ProgramsGrid = () => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {programs.map((program) => {
          const IconComponent = program.icon;
          
          const cardContent = (
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full">
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full ${program.color} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-gray-600 text-sm">
                  {program.description}
                </CardDescription>
              </CardContent>
            </Card>
          );

          // If the program has a route, wrap it in a Link, otherwise return the card directly
          return program.route ? (
            <Link key={program.id} to={program.route} className="group">
              {cardContent}
            </Link>
          ) : (
            <div key={program.id} className="group">
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};
