import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useSupabaseClient } from "#imports";

interface UserApproval {
  is_approved: boolean;
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login and signup pages
  if (to.path === "/login" || to.path === "/signup") {
    return;
  }

  const supabase = useSupabaseClient();

  // Get authenticated user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // If no authenticated user, redirect to login
  if (userError || !user) {
    return navigateTo("/login");
  }

  // For root route (dashboard), check if user is approved
  if (to.path === "/") {
    const { data: userApproval, error } = await supabase
      .from("user_approvals")
      .select("is_approved")
      .eq("id", user.id)
      .single<UserApproval>();

    if (error || !userApproval || !userApproval.is_approved) {
      return navigateTo("/pending-approval");
    }
  }
});
