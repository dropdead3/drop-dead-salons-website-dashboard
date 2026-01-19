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
      account_approval_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          performed_by: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          performed_by: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          performed_by?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          priority: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistant_assignments: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          last_assigned_at: string | null
          total_assignments: number | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          last_assigned_at?: string | null
          total_assignments?: number | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          last_assigned_at?: string | null
          total_assignments?: number | null
        }
        Relationships: []
      }
      assistant_requests: {
        Row: {
          assistant_id: string | null
          client_name: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          request_date: string
          service_id: string
          start_time: string
          status: string
          stylist_id: string
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          client_name: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          request_date: string
          service_id: string
          start_time: string
          status?: string
          stylist_id: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          client_name?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          request_date?: string
          service_id?: string
          start_time?: string
          status?: string
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "salon_services"
            referencedColumns: ["id"]
          },
        ]
      }
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
      dashboard_element_visibility: {
        Row: {
          created_at: string
          element_category: string
          element_key: string
          element_name: string
          id: string
          is_visible: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          element_category: string
          element_key: string
          element_name: string
          id?: string
          is_visible?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          element_category?: string
          element_key?: string
          element_name?: string
          id?: string
          is_visible?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      employee_location_schedules: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          updated_at: string | null
          user_id: string
          work_days: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          updated_at?: string | null
          user_id: string
          work_days?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          updated_at?: string | null
          user_id?: string
          work_days?: string[] | null
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          admin_approved_at: string | null
          admin_approved_by: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          dd_certified: boolean | null
          display_name: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          highlighted_services: string[] | null
          hire_date: string | null
          homepage_requested: boolean | null
          homepage_requested_at: string | null
          homepage_visible: boolean | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_booking: boolean | null
          is_super_admin: boolean | null
          location_id: string | null
          location_ids: string[] | null
          phone: string | null
          photo_url: string | null
          specialties: string[] | null
          stylist_level: string | null
          stylist_type: Database["public"]["Enums"]["stylist_type"] | null
          tiktok: string | null
          updated_at: string
          user_id: string
          work_days: string[] | null
        }
        Insert: {
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          dd_certified?: boolean | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          highlighted_services?: string[] | null
          hire_date?: string | null
          homepage_requested?: boolean | null
          homepage_requested_at?: string | null
          homepage_visible?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_booking?: boolean | null
          is_super_admin?: boolean | null
          location_id?: string | null
          location_ids?: string[] | null
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          stylist_level?: string | null
          stylist_type?: Database["public"]["Enums"]["stylist_type"] | null
          tiktok?: string | null
          updated_at?: string
          user_id: string
          work_days?: string[] | null
        }
        Update: {
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          dd_certified?: boolean | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          highlighted_services?: string[] | null
          hire_date?: string | null
          homepage_requested?: boolean | null
          homepage_requested_at?: string | null
          homepage_visible?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_booking?: boolean | null
          is_super_admin?: boolean | null
          location_id?: string | null
          location_ids?: string[] | null
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          stylist_level?: string | null
          stylist_type?: Database["public"]["Enums"]["stylist_type"] | null
          tiktok?: string | null
          updated_at?: string
          user_id?: string
          work_days?: string[] | null
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
      locations: {
        Row: {
          address: string
          booking_url: string | null
          city: string
          created_at: string | null
          display_order: number | null
          google_maps_url: string | null
          holiday_closures: Json | null
          hours: string | null
          hours_json: Json | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          booking_url?: string | null
          city: string
          created_at?: string | null
          display_order?: number | null
          google_maps_url?: string | null
          holiday_closures?: Json | null
          hours?: string | null
          hours_json?: Json | null
          id: string
          is_active?: boolean | null
          name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          booking_url?: string | null
          city?: string
          created_at?: string | null
          display_order?: number | null
          google_maps_url?: string | null
          holiday_closures?: Json | null
          hours?: string | null
          hours_json?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      one_on_one_meetings: {
        Row: {
          coach_id: string
          created_at: string
          end_time: string
          id: string
          meeting_date: string
          meeting_type: string | null
          notes: string | null
          requester_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          end_time: string
          id?: string
          meeting_date: string
          meeting_type?: string | null
          notes?: string | null
          requester_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          end_time?: string
          id?: string
          meeting_date?: string
          meeting_type?: string | null
          notes?: string | null
          requester_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
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
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_services: {
        Row: {
          category: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_change_requests: {
        Row: {
          created_at: string | null
          current_days: string[] | null
          id: string
          location_id: string
          reason: string | null
          requested_days: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_days?: string[] | null
          id?: string
          location_id: string
          reason?: string | null
          requested_days: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_days?: string[] | null
          id?: string
          location_id?: string
          reason?: string | null
          requested_days?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
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
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
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
      can_approve_admin_role: { Args: { _user_id: string }; Returns: boolean }
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
      app_role:
        | "admin"
        | "manager"
        | "stylist"
        | "receptionist"
        | "assistant"
        | "stylist_assistant"
        | "admin_assistant"
        | "operations_assistant"
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
      app_role: [
        "admin",
        "manager",
        "stylist",
        "receptionist",
        "assistant",
        "stylist_assistant",
        "admin_assistant",
        "operations_assistant",
      ],
      lead_source: ["content", "ads", "referral", "google", "walkin", "other"],
      program_status: ["active", "paused", "completed", "restarted"],
      stylist_type: ["independent", "commission", "salon_owner"],
      touchpoint_type: ["call", "text", "email", "social", "in_person"],
    },
  },
} as const
