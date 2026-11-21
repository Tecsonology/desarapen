
import UserManagement from "./UserManagement";

const Employees = () => {
  return (
    <UserManagement
      accountRole="employee"
      title="Employee Management"
      subtitle="Create and manage employee accounts for your store."
    />
  );
};

export default Employees;
