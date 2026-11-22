
const URL = `${import.meta.env.VITE_PUBLIC_URL}/api/users`;

type LoginCredentials = {
  username: string;
  password: string;
};

export type LoggedInUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "employee";
  status: "active" | "inactive";
};

export type LoginResponse = {
  message: string;
  token: string;
  user: LoggedInUser;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse(response);
};


export const logoutUser = async () => {
  const response = await fetch(`${URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  return handleResponse(response);
};
