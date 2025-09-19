export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      folder_listings: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_listings_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          bedroom_count: number
          change_history: Json | null
          created_at: string | null
          currency: string
          extraction_job_id: string | null
          id: string
          image: string | null
          last_checked: string | null
          location: string
          markdown_content: string | null
          price: number
          price_per_sqm: number | null
          title: string
          updated_at: string | null
          updated_flag: boolean | null
          url: string
          user_id: string
        }
        Insert: {
          bedroom_count: number
          change_history?: Json | null
          created_at?: string | null
          currency?: string
          extraction_job_id?: string | null
          id?: string
          image?: string | null
          last_checked?: string | null
          location: string
          markdown_content?: string | null
          price: number
          price_per_sqm?: number | null
          title: string
          updated_at?: string | null
          updated_flag?: boolean | null
          url: string
          user_id: string
        }
        Update: {
          bedroom_count?: number
          change_history?: Json | null
          created_at?: string | null
          currency?: string
          extraction_job_id?: string | null
          id?: string
          image?: string | null
          last_checked?: string | null
          location?: string
          markdown_content?: string | null
          price?: number
          price_per_sqm?: number | null
          title?: string
          updated_at?: string | null
          updated_flag?: boolean | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      team_listings: {
        Row: {
          bedroom_count: number
          change_history: Json | null
          created_at: string | null
          currency: string
          extraction_job_id: string | null
          id: string
          image: string | null
          last_checked: string | null
          location: string
          markdown_content: string | null
          price: number
          title: string
          updated_at: string | null
          updated_flag: boolean | null
          url: string
          user_id: string | null
        }
        Insert: {
          bedroom_count: number
          change_history?: Json | null
          created_at?: string | null
          currency: string
          extraction_job_id?: string | null
          id: string
          image?: string | null
          last_checked?: string | null
          location: string
          markdown_content?: string | null
          price: number
          title: string
          updated_at?: string | null
          updated_flag?: boolean | null
          url: string
          user_id?: string | null
        }
        Update: {
          bedroom_count?: number
          change_history?: Json | null
          created_at?: string | null
          currency?: string
          extraction_job_id?: string | null
          id?: string
          image?: string | null
          last_checked?: string | null
          location?: string
          markdown_content?: string | null
          price?: number
          title?: string
          updated_at?: string | null
          updated_flag?: boolean | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users_view: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string | null
          id: string
          is_approved: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user: {
        Args: { admin_id: string; user_id: string }
        Returns: boolean
      }
      can_add_to_team: {
        Args: { user_email: string }
        Returns: boolean
      }
      create_team: {
        Args: { creator_id: string; team_name: string }
        Returns: string
      }
      initialize_team_listings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initialize_users_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      invoke_daily_scrape: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_approved: {
        Args: { user_id: string }
        Returns: boolean
      }
      make_user_admin: {
        Args: { admin_id: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "admin"],
    },
  },
} as const
