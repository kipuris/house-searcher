<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Team Management
        </h1>
      </div>

      <!-- Create Team Button -->
      <div class="mb-8">
        <UButton
          color="primary"
          icon="i-heroicons-user-group"
          @click="showCreateTeamModal = true"
        >
          Create New Team
        </UButton>
      </div>

      <!-- Teams Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <UCard v-for="team in teams" :key="team.id" class="relative">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">{{ team.name }}</h3>
              <UButton
                v-if="isTeamCreator(team)"
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                :loading="deletingTeam === team.id"
                @click="deleteTeam(team)"
              />
            </div>
          </template>

          <!-- Team Members -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h4 class="text-sm font-medium text-gray-700">Team Members</h4>
              <UButton
                v-if="isTeamCreator(team)"
                color="primary"
                variant="ghost"
                icon="i-heroicons-plus"
                size="xs"
                @click="openAddMemberModal(team)"
              >
                Add Member
              </UButton>
            </div>

            <div class="divide-y divide-gray-200">
              <div
                v-for="member in teamMembers[team.id]"
                :key="member.id"
                class="py-3 flex justify-between items-center"
              >
                <div class="flex items-center space-x-3">
                  <UIcon
                    name="i-heroicons-user-circle"
                    class="w-5 h-5 text-gray-400"
                  />
                  <span class="text-sm text-gray-900">{{
                    getUserEmail(member)
                  }}</span>
                  <UBadge
                    v-if="member.user_id === team.created_by"
                    color="primary"
                    variant="subtle"
                    label="Creator"
                  />
                </div>
                <UButton
                  v-if="
                    isTeamCreator(team) && member.user_id !== team.created_by
                  "
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  :loading="removingMember === member.id"
                  @click="removeMember(team.id, member.id)"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Create Team Modal -->
      <UModal v-model="showCreateTeamModal" :ui="{ container: 'items-center' }">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">Create New Team</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="closeCreateTeamModal"
              />
            </div>
          </template>

          <form @submit.prevent="createTeam" class="space-y-4">
            <UFormGroup label="Team Name" required>
              <UInput
                v-model="newTeamName"
                placeholder="Enter team name"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
              <p v-if="error" class="mt-1 text-sm text-red-600">
                {{ error }}
              </p>
            </UFormGroup>

            <div class="flex justify-end space-x-3">
              <UButton
                color="gray"
                variant="soft"
                @click="closeCreateTeamModal"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="creatingTeam"
                :disabled="!newTeamName"
              >
                Create Team
              </UButton>
            </div>
          </form>
        </UCard>
      </UModal>

      <!-- Add Member Modal -->
      <UModal v-model="showAddMemberModal" :ui="{ container: 'items-center' }">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">Add Team Member</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="closeAddMemberModal"
              />
            </div>
          </template>

          <form @submit.prevent="addMember" class="space-y-4">
            <UFormGroup label="User Email" required>
              <UInput
                v-model="newMemberEmail"
                type="email"
                placeholder="Enter user email"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
              <p v-if="addMemberError" class="mt-1 text-sm text-red-600">
                {{ addMemberError }}
              </p>
            </UFormGroup>

            <div class="flex justify-end space-x-3">
              <UButton color="gray" variant="soft" @click="closeAddMemberModal">
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="addingMember"
                :disabled="!newMemberEmail"
              >
                Add Member
              </UButton>
            </div>
          </form>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type UserView = Database["public"]["Tables"]["users_view"]["Row"];

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();

// State
const teams = ref<Team[]>([]);
const teamMembers = ref<Record<string, TeamMember[]>>({});
const loading = ref(true);
const error = ref<string | null>(null);
const showCreateTeamModal = ref(false);
const newTeamName = ref("");
const creatingTeam = ref(false);
const showAddMemberModal = ref(false);
const selectedTeam = ref<Team | null>(null);
const newMemberEmail = ref("");
const addingMember = ref(false);
const addMemberError = ref<string | null>(null);
const deletingTeam = ref<string | null>(null);
const removingMember = ref<string | null>(null);

// Set meta tags for the teams page
const { setPageMeta } = useSiteMeta();
setPageMeta({
  title: "Teams",
  description:
    "Collaborate with others on property searches. Create and manage teams to share listings.",
});

// Use useAsyncData to fetch teams data
const {
  data: teamsData,
  pending,
  error: teamsError,
  refresh: refreshTeams,
} = useAsyncData("teams-data", async () => {
  try {
    // Get teams the user is a member of
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (teamsError) throw teamsError;

    // Get team members for each team
    const { data: membersData, error: membersError } = await supabase
      .from("team_members")
      .select("*, user:user_id(email)");

    if (membersError) throw membersError;

    // Organize members by team
    const membersByTeam: Record<string, TeamMember[]> = {};
    if (membersData) {
      membersData.forEach((member) => {
        if (!membersByTeam[member.team_id]) {
          membersByTeam[member.team_id] = [];
        }
        membersByTeam[member.team_id].push(member);
      });
    }

    // Update the refs with the fetched data
    teams.value = teamsData || [];
    teamMembers.value = membersByTeam;

    return { teams: teamsData, teamMembers: membersByTeam };
  } catch (e: any) {
    console.error("Error fetching teams:", e);
    error.value = e.message;
    throw e;
  }
});

// Update loading state based on pending
watch(pending, (isPending) => {
  loading.value = isPending;
});

// Create a new team
const createTeam = async () => {
  if (!newTeamName.value.trim()) {
    error.value = "Please enter a team name";
    return;
  }

  try {
    creatingTeam.value = true;
    error.value = null;

    // Get the user ID, with fallback to empty string if undefined
    const userId = user.value?.id || "";

    const { data, error: createError } = await supabase.rpc("create_team", {
      team_name: newTeamName.value.trim(),
      creator_id: userId,
    });

    if (createError) throw createError;

    // Refresh teams using useAsyncData's refresh function
    await refreshTeams();

    // Reset form
    newTeamName.value = "";
    showCreateTeamModal.value = false;
  } catch (e: any) {
    console.error("Error creating team:", e);
    error.value = e.message;
  } finally {
    creatingTeam.value = false;
  }
};

// Add a member to a team
const addMember = async () => {
  if (!newMemberEmail.value.trim() || !selectedTeam.value) {
    addMemberError.value = "Please enter a valid email address";
    return;
  }

  try {
    addingMember.value = true;
    addMemberError.value = null;

    // Check if user can be added
    const { data: canAdd, error: checkError } = await supabase.rpc(
      "can_add_to_team",
      {
        user_email: newMemberEmail.value.trim(),
      }
    );

    if (checkError) throw checkError;

    if (!canAdd) {
      throw new Error(
        "User not found or not approved. Only approved users can be added to teams."
      );
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from("users_view")
      .select("id")
      .eq("email", newMemberEmail.value.trim())
      .single();

    if (userError) throw userError;

    // Add user to team
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: selectedTeam.value.id,
      user_id: userData.id,
      added_by: user.value?.id,
    });

    if (memberError) throw memberError;

    // Refresh teams using useAsyncData's refresh function
    await refreshTeams();

    // Reset form
    newMemberEmail.value = "";
    showAddMemberModal.value = false;
  } catch (e: any) {
    console.error("Error adding team member:", e);
    addMemberError.value = e.message;
  } finally {
    addingMember.value = false;
  }
};

// Delete a team
const deleteTeam = async (team: Team) => {
  if (!confirm(`Are you sure you want to delete the team "${team.name}"?`)) {
    return;
  }

  try {
    deletingTeam.value = team.id;

    const { error } = await supabase.from("teams").delete().eq("id", team.id);

    if (error) throw error;

    // Refresh teams using useAsyncData's refresh function
    await refreshTeams();
  } catch (e: any) {
    console.error("Error deleting team:", e);
    error.value = e.message;
  } finally {
    deletingTeam.value = null;
  }
};

// Remove a member from a team
const removeMember = async (teamId: string, memberId: string) => {
  if (!confirm("Are you sure you want to remove this member?")) {
    return;
  }

  try {
    removingMember.value = memberId;

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;

    // Refresh teams using useAsyncData's refresh function
    await refreshTeams();
  } catch (e: any) {
    console.error("Error removing team member:", e);
    error.value = e.message;
  } finally {
    removingMember.value = null;
  }
};

// Open add member modal
const openAddMemberModal = (team: Team) => {
  selectedTeam.value = team;
  showAddMemberModal.value = true;
};

// Check if user is team creator
const isTeamCreator = (team: Team) => {
  return team.created_by === user.value?.id;
};

// Check if user is team member
const isTeamMember = (teamId: string) => {
  if (!teamMembers.value[teamId]) return false;
  return teamMembers.value[teamId].some(
    (member) => member.user_id === user.value?.id
  );
};

// Get user email from member
const getUserEmail = (member: any) => {
  return member.user?.email || "Unknown";
};

// Close modals
const closeCreateTeamModal = () => {
  showCreateTeamModal.value = false;
  newTeamName.value = "";
  error.value = null;
};

const closeAddMemberModal = () => {
  showAddMemberModal.value = false;
  newMemberEmail.value = "";
  addMemberError.value = null;
};
</script>
