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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coach_notes: {
        Row: {
          coach_user_id: string
          created_at: string
          enrollment_id: string
          id: string
          note_text: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          coach_user_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          note_text: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          coach_user_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          note_text?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_completions: {
        Row: {
          all_tasks_done: boolean
          completion_date: string
          created_at: string
          day_number: number
          enrollment_id: string
          id: string
          is_complete: boolean
          metrics_logged: boolean
          proof_notes: string | null
          proof_type: string | null
          proof_url: string | null
          tasks_completed: Json | null
          updated_at: string
        }
        Insert: {
          all_tasks_done?: boolean
          completion_date?: string
          created_at?: string
          day_number: number
          enrollment_id: string
          id?: string
          is_complete?: boolean
          metrics_logged?: boolean
          proof_notes?: string | null
          proof_type?: string | null
          proof_url?: string | null
          tasks_completed?: Json | null
          updated_at?: string
        }
        Update: {
          all_tasks_done?: boolean
          completion_date?: string
          created_at?: string
          day_number?: number
          enrollment_id?: string
          id?: string
          is_complete?: boolean
          metrics_logged?: boolean
          proof_notes?: string | null
          proof_type?: string | null
          proof_url?: string | null
          tasks_completed?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          ad_leads: number | null
          completion_id: string
          consults_booked: number | null
          consults_completed: number | null
          created_at: string
          dms_received: number | null
          id: string
          inquiry_forms: number | null
          new_clients: number | null
          posts_published: number | null
          profile_visits: number | null
          reach: number | null
          reels_published: number | null
          referral_leads: number | null
          revenue_booked: number | null
          saves: number | null
          services_booked: number | null
          shares: number | null
          stories_published: number | null
          total_leads: number | null
          updated_at: string
        }
        Insert: {
          ad_leads?: number | null
          completion_id: string
          consults_booked?: number | null
          consults_completed?: number | null
          created_at?: string
          dms_received?: number | null
          id?: string
          inquiry_forms?: number | null
          new_clients?: number | null
          posts_published?: number | null
          profile_visits?: number | null
          reach?: number | null
          reels_published?: number | null
          referral_leads?: number | null
          revenue_booked?: number | null
          saves?: number | null
          services_booked?: number | null
          shares?: number | null
          stories_published?: number | null
          total_leads?: number | null
          updated_at?: string
        }
        Update: {
          ad_leads?: number | null
          completion_id?: string
          consults_booked?: number | null
          consults_completed?: number | null
          created_at?: string
          dms_received?: number | null
          id?: string
          inquiry_forms?: number | null
          new_clients?: number | null
          posts_published?: number | null
          profile_visits?: number | null
          reach?: number | null
          reels_published?: number | null
          referral_leads?: number | null
          revenue_booked?: number | null
          saves?: number | null
          services_booked?: number | null
          shares?: number | null
          stories_published?: number | null
          total_leads?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: true
            referencedRelation: "daily_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          hire_date: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          location_id: string | null
          phone: string | null
          photo_url: string | null
          specialties: string[] | null
          stylist_level: string | null
          stylist_type: Database["public"]["Enums"]["stylist_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          location_id?: string | null
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          stylist_level?: string | null
          stylist_type?: Database["public"]["Enums"]["stylist_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          location_id?: string | null
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          stylist_level?: string | null
          stylist_type?: Database["public"]["Enums"]["stylist_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      handbook_acknowledgments: {
        Row: {
          acknowledged_at: string
          handbook_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          handbook_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          handbook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handbook_acknowledgments_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      handbooks: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
          version: string | null
          visible_to_roles: Database["public"]["Enums"]["app_role"][] | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
          version?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          version?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Relationships: []
      }
      ring_the_bell_entries: {
        Row: {
          closing_script: string | null
          coach_note: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_pinned: boolean | null
          lead_source: Database["public"]["Enums"]["lead_source"]
          screenshot_url: string | null
          service_booked: string
          ticket_value: number
          user_id: string
        }
        Insert: {
          closing_script?: string | null
          coach_note?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_pinned?: boolean | null
          lead_source?: Database["public"]["Enums"]["lead_source"]
          screenshot_url?: string | null
          service_booked: string
          ticket_value: number
          user_id: string
        }
        Update: {
          closing_script?: string | null
          coach_note?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_pinned?: boolean | null
          lead_source?: Database["public"]["Enums"]["lead_source"]
          screenshot_url?: string | null
          service_booked?: string
          ticket_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ring_the_bell_entries_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_program_enrollment: {
        Row: {
          completed_at: string | null
          created_at: string
          current_day: number
          id: string
          last_completion_date: string | null
          restart_count: number
          start_date: string
          status: Database["public"]["Enums"]["program_status"]
          streak_count: number
          updated_at: string
          user_id: string
          weekly_wins_due_day: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          last_completion_date?: string | null
          restart_count?: number
          start_date?: string
          status?: Database["public"]["Enums"]["program_status"]
          streak_count?: number
          updated_at?: string
          user_id: string
          weekly_wins_due_day?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          last_completion_date?: string | null
          restart_count?: number
          start_date?: string
          status?: Database["public"]["Enums"]["program_status"]
          streak_count?: number
          updated_at?: string
          user_id?: string
          weekly_wins_due_day?: number | null
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          user_id: string
          video_id: string
          watch_progress: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
          video_id: string
          watch_progress?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
          video_id?: string
          watch_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          order_index: number | null
          required_for_roles: Database["public"]["Enums"]["app_role"][] | null
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          required_for_roles?: Database["public"]["Enums"]["app_role"][] | null
          storage_path?: string | null
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          required_for_roles?: Database["public"]["Enums"]["app_role"][] | null
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_wins_reports: {
        Row: {
          adjustment_for_next_week: string | null
          bottleneck: string | null
          created_at: string
          due_day: number
          enrollment_id: string
          id: string
          is_submitted: boolean
          numbers_snapshot: Json | null
          submitted_at: string | null
          updated_at: string
          week_number: number
          what_worked: string | null
          wins_this_week: string | null
        }
        Insert: {
          adjustment_for_next_week?: string | null
          bottleneck?: string | null
          created_at?: string
          due_day: number
          enrollment_id: string
          id?: string
          is_submitted?: boolean
          numbers_snapshot?: Json | null
          submitted_at?: string | null
          updated_at?: string
          week_number: number
          what_worked?: string | null
          wins_this_week?: string | null
        }
        Update: {
          adjustment_for_next_week?: string | null
          bottleneck?: string | null
          created_at?: string
          due_day?: number
          enrollment_id?: string
          id?: string
          is_submitted?: boolean
          numbers_snapshot?: Json | null
          submitted_at?: string | null
          updated_at?: string
          week_number?: number
          what_worked?: string | null
          wins_this_week?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_wins_reports_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_coach: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coach_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "stylist" | "receptionist" | "assistant"
      lead_source:
        | "content"
        | "ads"
        | "referral"
        | "google"
        | "walkin"
        | "other"
      program_status: "active" | "paused" | "completed" | "restarted"
      stylist_type: "independent" | "commission" | "salon_owner"
      touchpoint_type: "call" | "text" | "email" | "social" | "in_person"
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
      app_role: ["admin", "manager", "stylist", "receptionist", "assistant"],
      lead_source: ["content", "ads", "referral", "google", "walkin", "other"],
      program_status: ["active", "paused", "completed", "restarted"],
      stylist_type: ["independent", "commission", "salon_owner"],
      touchpoint_type: ["call", "text", "email", "social", "in_person"],
    },
  },
} as const
