import React from 'react';
const useQuery = ({ queryKey, queryFn, retry, refetchOnWindowFocus }) => {
  const user = {
    id: "demo-user",
    role: "admin",
  };
  return {
    data: user,
    isLoading: false,
    error: null,
  };
};
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => ({ id: "demo-user", role: "admin" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
