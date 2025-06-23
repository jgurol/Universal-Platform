
import { NavigationBar } from "@/components/NavigationBar";
import { OrdersManagement as OrdersManagementComponent } from "@/components/OrdersManagement";

const OrdersManagement = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <OrdersManagementComponent />
      </div>
    </div>
  );
};

export default OrdersManagement;
