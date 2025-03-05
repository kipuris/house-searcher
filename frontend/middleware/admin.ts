import { useSupabaseClient } from "#imports";
import { defineNuxtRouteMiddleware, navigateTo } from "#app";

interface UserApproval {
  role: "user" | "admin";
  is_approved: boolean;
}

export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return navigateTo("/login");
  }

  // Check if user is an admin using user_approvals table
  const { data: userApproval, error } = await supabase
    .from("user_approvals")
    .select("role, is_approved")
    .eq("id", session.user.id)
    .single<UserApproval>();

  if (
    error || !userApproval || userApproval.role !== "admin" ||
    !userApproval.is_approved
  ) {
    console.error("Access denied: User is not an approved admin");
    return navigateTo("/");
  }
});
