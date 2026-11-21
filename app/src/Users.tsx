
import UserManagement from "./UserManagement";

const Users = () => {
  return (
    <UserManagement
      accountRole="admin"
      title="User Management"
      subtitle="Create and manage administrator accounts for your POS system."
    />
  );
};

export default Users;
