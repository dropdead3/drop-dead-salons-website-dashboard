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
          link_label: string | null
          link_url: string | null
          priority: string | null
          sort_order: number | null
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
          link_label?: string | null
          link_url?: string | null
          priority?: string | null
          sort_order?: number | null
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
          link_label?: string | null
          link_url?: string | null
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_notes: {
        Row: {
          author_id: string
          created_at: string | null
          id: string
          is_private: boolean | null
          note: string
          phorest_appointment_id: string
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note: string
          phorest_appointment_id: string
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note?: string
          phorest_appointment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assistant_assignments: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          last_assigned_at: string | null
          location_id: string | null
          total_assignments: number | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          last_assigned_at?: string | null
          location_id?: string | null
          total_assignments?: number | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          last_assigned_at?: string | null
          location_id?: string | null
          total_assignments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_requests: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assistant_id: string | null
          client_name: string
          created_at: string
          declined_by: string[] | null
          end_time: string
          id: string
          location_id: string | null
          notes: string | null
          parent_request_id: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          request_date: string
          response_deadline_hours: number | null
          response_time_seconds: number | null
          service_id: string
          start_time: string
          status: string
          stylist_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assistant_id?: string | null
          client_name: string
          created_at?: string
          declined_by?: string[] | null
          end_time: string
          id?: string
          location_id?: string | null
          notes?: string | null
          parent_request_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          request_date: string
          response_deadline_hours?: number | null
          response_time_seconds?: number | null
          service_id: string
          start_time: string
          status?: string
          stylist_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assistant_id?: string | null
          client_name?: string
          created_at?: string
          declined_by?: string[] | null
          end_time?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          parent_request_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          request_date?: string
          response_deadline_hours?: number | null
          response_time_seconds?: number | null
          service_id?: string
          start_time?: string
          status?: string
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_requests_parent_request_id_fkey"
            columns: ["parent_request_id"]
            isOneToOne: false
            referencedRelation: "assistant_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "salon_services"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_entry_high_fives: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_entry_high_fives_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "ring_the_bell_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      build_tasks: {
        Row: {
          blocked_by: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          notes: string[] | null
          priority: string
          sort_order: number | null
          status: string
          task_key: string
          title: string
          updated_at: string
        }
        Insert: {
          blocked_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string[] | null
          priority?: string
          sort_order?: number | null
          status?: string
          task_key: string
          title: string
          updated_at?: string
        }
        Update: {
          blocked_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string[] | null
          priority?: string
          sort_order?: number | null
          status?: string
          task_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_card_requests: {
        Row: {
          design_style: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          design_style: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          design_style?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          business_name: string
          city: string | null
          created_at: string
          default_tax_rate: number | null
          ein: string | null
          email: string | null
          icon_dark_url: string | null
          icon_light_url: string | null
          id: string
          legal_name: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          mailing_address: string | null
          phone: string | null
          sidebar_layout: Json | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          business_name?: string
          city?: string | null
          created_at?: string
          default_tax_rate?: number | null
          ein?: string | null
          email?: string | null
          icon_dark_url?: string | null
          icon_light_url?: string | null
          id?: string
          legal_name?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          mailing_address?: string | null
          phone?: string | null
          sidebar_layout?: Json | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          created_at?: string
          default_tax_rate?: number | null
          ein?: string | null
          email?: string | null
          icon_dark_url?: string | null
          icon_light_url?: string | null
          id?: string
          legal_name?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          mailing_address?: string | null
          phone?: string | null
          sidebar_layout?: Json | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      calendar_preferences: {
        Row: {
          color_by: string | null
          created_at: string | null
          default_location_id: string | null
          default_view: string | null
          hours_end: number | null
          hours_start: number | null
          id: string
          show_cancelled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_by?: string | null
          created_at?: string | null
          default_location_id?: string | null
          default_view?: string | null
          hours_end?: number | null
          hours_start?: number | null
          id?: string
          show_cancelled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_by?: string | null
          created_at?: string | null
          default_location_id?: string | null
          default_view?: string | null
          hours_end?: number | null
          hours_start?: number | null
          id?: string
          show_cancelled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_preferences_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_theme_settings: {
        Row: {
          calendar_bg_color: string
          cell_border_color: string
          cell_border_style: string
          cell_border_width: number
          created_at: string
          current_time_color: string
          days_row_bg_color: string
          days_row_text_color: string
          half_hour_line_color: string
          header_bg_color: string
          header_text_color: string
          hour_line_color: string
          id: string
          outside_month_bg_color: string
          quarter_hour_line_color: string
          today_badge_bg_color: string
          today_badge_text_color: string
          today_highlight_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_bg_color?: string
          cell_border_color?: string
          cell_border_style?: string
          cell_border_width?: number
          created_at?: string
          current_time_color?: string
          days_row_bg_color?: string
          days_row_text_color?: string
          half_hour_line_color?: string
          header_bg_color?: string
          header_text_color?: string
          hour_line_color?: string
          id?: string
          outside_month_bg_color?: string
          quarter_hour_line_color?: string
          today_badge_bg_color?: string
          today_badge_text_color?: string
          today_highlight_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_bg_color?: string
          cell_border_color?: string
          cell_border_style?: string
          cell_border_width?: number
          created_at?: string
          current_time_color?: string
          days_row_bg_color?: string
          days_row_text_color?: string
          half_hour_line_color?: string
          header_bg_color?: string
          header_text_color?: string
          hour_line_color?: string
          id?: string
          outside_month_bg_color?: string
          quarter_hour_line_color?: string
          today_badge_bg_color?: string
          today_badge_text_color?: string
          today_highlight_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          entry_type: string
          id: string
          is_major: boolean | null
          notification_sent: boolean | null
          published_at: string | null
          release_date: string | null
          scheduled_publish_at: string | null
          send_as_announcement: boolean | null
          send_as_notification: boolean | null
          sort_order: number | null
          status: string
          target_roles: string[] | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          entry_type?: string
          id?: string
          is_major?: boolean | null
          notification_sent?: boolean | null
          published_at?: string | null
          release_date?: string | null
          scheduled_publish_at?: string | null
          send_as_announcement?: boolean | null
          send_as_notification?: boolean | null
          sort_order?: number | null
          status?: string
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          entry_type?: string
          id?: string
          is_major?: boolean | null
          notification_sent?: boolean | null
          published_at?: string | null
          release_date?: string | null
          scheduled_publish_at?: string | null
          send_as_announcement?: boolean | null
          send_as_notification?: boolean | null
          sort_order?: number | null
          status?: string
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      changelog_reads: {
        Row: {
          changelog_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          changelog_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          changelog_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_reads_changelog_id_fkey"
            columns: ["changelog_id"]
            isOneToOne: false
            referencedRelation: "changelog_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_votes: {
        Row: {
          changelog_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          changelog_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          changelog_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_votes_changelog_id_fkey"
            columns: ["changelog_id"]
            isOneToOne: false
            referencedRelation: "changelog_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_private: boolean | null
          note: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "phorest_clients"
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
          is_pinned: boolean
          note_text: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          coach_user_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          is_pinned?: boolean
          note_text: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          coach_user_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          is_pinned?: boolean
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
      commission_tiers: {
        Row: {
          applies_to: string
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          max_revenue: number | null
          min_revenue: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          applies_to?: string
          commission_rate: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_revenue?: number | null
          min_revenue: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          applies_to?: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_revenue?: number | null
          min_revenue?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
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
      day_rate_agreements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          title: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      day_rate_bookings: {
        Row: {
          agreement_signed_at: string | null
          agreement_version: string | null
          amount_paid: number | null
          booking_date: string
          business_name: string | null
          chair_id: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          license_number: string
          license_state: string
          location_id: string
          notes: string | null
          status: Database["public"]["Enums"]["day_rate_booking_status"]
          stripe_payment_id: string | null
          stylist_email: string
          stylist_name: string
          stylist_phone: string
          updated_at: string
        }
        Insert: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          amount_paid?: number | null
          booking_date: string
          business_name?: string | null
          chair_id?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          license_number: string
          license_state: string
          location_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["day_rate_booking_status"]
          stripe_payment_id?: string | null
          stylist_email: string
          stylist_name: string
          stylist_phone: string
          updated_at?: string
        }
        Update: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          amount_paid?: number | null
          booking_date?: string
          business_name?: string | null
          chair_id?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          license_number?: string
          license_state?: string
          location_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["day_rate_booking_status"]
          stripe_payment_id?: string | null
          stylist_email?: string
          stylist_name?: string
          stylist_phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_rate_bookings_chair_id_fkey"
            columns: ["chair_id"]
            isOneToOne: false
            referencedRelation: "day_rate_chairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_rate_bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      day_rate_chairs: {
        Row: {
          chair_number: number
          created_at: string
          daily_rate: number | null
          id: string
          is_available: boolean | null
          location_id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          chair_number: number
          created_at?: string
          daily_rate?: number | null
          id?: string
          is_available?: boolean | null
          location_id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          chair_number?: number
          created_at?: string
          daily_rate?: number | null
          id?: string
          is_available?: boolean | null
          location_id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_rate_chairs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_digest_log: {
        Row: {
          digest_type: string
          entries_included: string[]
          id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          digest_type: string
          entries_included: string[]
          id?: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          digest_type?: string
          entries_included?: string[]
          id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          blocks_json: Json | null
          created_at: string | null
          description: string | null
          html_body: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          blocks_json?: Json | null
          created_at?: string | null
          description?: string | null
          html_body: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          blocks_json?: Json | null
          created_at?: string | null
          description?: string | null
          html_body?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      email_themes: {
        Row: {
          accent_color: string
          body_bg: string
          body_text: string
          button_bg: string
          button_text: string
          created_at: string
          created_by: string
          description: string | null
          divider_color: string
          header_bg: string
          header_text: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          body_bg?: string
          body_text?: string
          button_bg?: string
          button_text?: string
          created_at?: string
          created_by: string
          description?: string | null
          divider_color?: string
          header_bg?: string
          header_text?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          body_bg?: string
          body_text?: string
          button_bg?: string
          button_text?: string
          created_at?: string
          created_by?: string
          description?: string | null
          divider_color?: string
          header_bg?: string
          header_text?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_variables: {
        Row: {
          category: string
          created_at: string | null
          description: string
          example: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          variable_key: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          example?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          variable_key: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          example?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          variable_key?: string
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
          departure_notes: string | null
          display_name: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          hide_numbers: boolean
          highlighted_services: string[] | null
          hire_date: string | null
          homepage_order: number | null
          homepage_requested: boolean | null
          homepage_requested_at: string | null
          homepage_visible: boolean | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_booking: boolean | null
          is_primary_owner: boolean | null
          is_super_admin: boolean | null
          location_id: string | null
          location_ids: string[] | null
          phone: string | null
          photo_url: string | null
          planned_departure_date: string | null
          preferred_social_handle: string | null
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
          departure_notes?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          hide_numbers?: boolean
          highlighted_services?: string[] | null
          hire_date?: string | null
          homepage_order?: number | null
          homepage_requested?: boolean | null
          homepage_requested_at?: string | null
          homepage_visible?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_booking?: boolean | null
          is_primary_owner?: boolean | null
          is_super_admin?: boolean | null
          location_id?: string | null
          location_ids?: string[] | null
          phone?: string | null
          photo_url?: string | null
          planned_departure_date?: string | null
          preferred_social_handle?: string | null
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
          departure_notes?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          hide_numbers?: boolean
          highlighted_services?: string[] | null
          hire_date?: string | null
          homepage_order?: number | null
          homepage_requested?: boolean | null
          homepage_requested_at?: string | null
          homepage_visible?: boolean | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_booking?: boolean | null
          is_primary_owner?: boolean | null
          is_super_admin?: boolean | null
          location_id?: string | null
          location_ids?: string[] | null
          phone?: string | null
          photo_url?: string | null
          planned_departure_date?: string | null
          preferred_social_handle?: string | null
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
      feature_flags: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled_for_roles: string[] | null
          enabled_for_users: string[] | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          percentage_rollout: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_roles?: string[] | null
          enabled_for_users?: string[] | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          percentage_rollout?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_roles?: string[] | null
          enabled_for_users?: string[] | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          percentage_rollout?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_request_votes: {
        Row: {
          created_at: string | null
          feature_request_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_request_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_request_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_feature_request_id_fkey"
            columns: ["feature_request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_response: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          linked_changelog_id: string | null
          priority: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
          submitted_by: string
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          linked_changelog_id?: string | null
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          submitted_by: string
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          linked_changelog_id?: string | null
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          submitted_by?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_linked_changelog_id_fkey"
            columns: ["linked_changelog_id"]
            isOneToOne: false
            referencedRelation: "changelog_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt: string
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          src: string
          updated_at: string | null
        }
        Insert: {
          alt: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          src: string
          updated_at?: string | null
        }
        Update: {
          alt?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          src?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_transformations: {
        Row: {
          after_image: string
          after_label: string | null
          before_image: string
          before_label: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          updated_at: string | null
        }
        Insert: {
          after_image: string
          after_label?: string | null
          before_image: string
          before_label?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          after_image?: string
          after_label?: string | null
          before_image?: string
          before_label?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      graduation_feedback: {
        Row: {
          coach_id: string
          created_at: string
          feedback: string
          id: string
          submission_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          feedback: string
          id?: string
          submission_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          feedback?: string
          id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "graduation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_requirements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      graduation_submissions: {
        Row: {
          assistant_id: string
          assistant_notes: string | null
          created_at: string
          id: string
          proof_url: string | null
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assistant_id: string
          assistant_notes?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          assistant_notes?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_submissions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "graduation_requirements"
            referencedColumns: ["id"]
          },
        ]
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
      headshot_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          scheduled_date: string | null
          scheduled_location: string | null
          scheduled_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          scheduled_date?: string | null
          scheduled_location?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          scheduled_date?: string | null
          scheduled_location?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      impersonation_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          session_id: string | null
          target_role: string | null
          target_user_id: string | null
          target_user_name: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
        }
        Relationships: []
      }
      inquiry_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          inquiry_id: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          inquiry_id: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_activity_log_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "salon_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_application_notes: {
        Row: {
          application_id: string
          author_id: string
          created_at: string
          id: string
          note: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          author_id: string
          created_at?: string
          id?: string
          note: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          assigned_to: string | null
          client_book: string
          created_at: string
          email: string
          experience: string
          id: string
          instagram: string | null
          is_archived: boolean | null
          is_starred: boolean | null
          last_contacted_at: string | null
          message: string | null
          name: string
          phone: string
          pipeline_stage: string
          rating: number | null
          source: string | null
          source_detail: string | null
          specialties: string
          updated_at: string
          why_drop_dead: string
        }
        Insert: {
          assigned_to?: string | null
          client_book: string
          created_at?: string
          email: string
          experience: string
          id?: string
          instagram?: string | null
          is_archived?: boolean | null
          is_starred?: boolean | null
          last_contacted_at?: string | null
          message?: string | null
          name: string
          phone: string
          pipeline_stage?: string
          rating?: number | null
          source?: string | null
          source_detail?: string | null
          specialties: string
          updated_at?: string
          why_drop_dead: string
        }
        Update: {
          assigned_to?: string | null
          client_book?: string
          created_at?: string
          email?: string
          experience?: string
          id?: string
          instagram?: string | null
          is_archived?: boolean | null
          is_starred?: boolean | null
          last_contacted_at?: string | null
          message?: string | null
          name?: string
          phone?: string
          pipeline_stage?: string
          rating?: number | null
          source?: string | null
          source_detail?: string | null
          specialties?: string
          updated_at?: string
          why_drop_dead?: string
        }
        Relationships: []
      }
      leaderboard_achievements: {
        Row: {
          badge_color: string
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          badge_color?: string
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          requirement_type: string
          requirement_value?: number
        }
        Update: {
          badge_color?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      leaderboard_history: {
        Row: {
          created_at: string
          extensions_rank: number | null
          extensions_value: number | null
          id: string
          new_clients_rank: number | null
          new_clients_value: number | null
          overall_rank: number
          overall_score: number
          retail_rank: number | null
          retail_value: number | null
          retention_rank: number | null
          retention_value: number | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          extensions_rank?: number | null
          extensions_value?: number | null
          id?: string
          new_clients_rank?: number | null
          new_clients_value?: number | null
          overall_rank: number
          overall_score: number
          retail_rank?: number | null
          retail_value?: number | null
          retention_rank?: number | null
          retention_value?: number | null
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          extensions_rank?: number | null
          extensions_value?: number | null
          id?: string
          new_clients_rank?: number | null
          new_clients_value?: number | null
          overall_rank?: number
          overall_score?: number
          retail_rank?: number | null
          retail_value?: number | null
          retention_rank?: number | null
          retention_value?: number | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      leaderboard_weights: {
        Row: {
          extensions_weight: number
          id: string
          new_clients_weight: number
          retail_weight: number
          retention_weight: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          extensions_weight?: number
          id?: string
          new_clients_weight?: number
          retail_weight?: number
          retention_weight?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          extensions_weight?: number
          id?: string
          new_clients_weight?: number
          retail_weight?: number
          retention_weight?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          appointment_padding_minutes: number | null
          assistant_ratio: number | null
          booking_url: string | null
          break_minutes_per_day: number | null
          city: string
          created_at: string | null
          day_rate_blackout_dates: string[] | null
          day_rate_default_price: number | null
          day_rate_enabled: boolean | null
          display_order: number | null
          google_maps_url: string | null
          holiday_closures: Json | null
          hours: string | null
          hours_json: Json | null
          id: string
          is_active: boolean | null
          lunch_minutes: number | null
          major_crossroads: string | null
          name: string
          phone: string
          phorest_branch_id: string | null
          show_on_website: boolean
          store_number: string | null
          stylist_capacity: number | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          appointment_padding_minutes?: number | null
          assistant_ratio?: number | null
          booking_url?: string | null
          break_minutes_per_day?: number | null
          city: string
          created_at?: string | null
          day_rate_blackout_dates?: string[] | null
          day_rate_default_price?: number | null
          day_rate_enabled?: boolean | null
          display_order?: number | null
          google_maps_url?: string | null
          holiday_closures?: Json | null
          hours?: string | null
          hours_json?: Json | null
          id: string
          is_active?: boolean | null
          lunch_minutes?: number | null
          major_crossroads?: string | null
          name: string
          phone: string
          phorest_branch_id?: string | null
          show_on_website?: boolean
          store_number?: string | null
          stylist_capacity?: number | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          appointment_padding_minutes?: number | null
          assistant_ratio?: number | null
          booking_url?: string | null
          break_minutes_per_day?: number | null
          city?: string
          created_at?: string | null
          day_rate_blackout_dates?: string[] | null
          day_rate_default_price?: number | null
          day_rate_enabled?: boolean | null
          display_order?: number | null
          google_maps_url?: string | null
          holiday_closures?: Json | null
          hours?: string | null
          hours_json?: Json | null
          id?: string
          is_active?: boolean | null
          lunch_minutes?: number | null
          major_crossroads?: string | null
          name?: string
          phone?: string
          phorest_branch_id?: string | null
          show_on_website?: boolean
          store_number?: string | null
          stylist_capacity?: number | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_name: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          platform: string | null
          spend_to_date: number | null
          start_date: string | null
          updated_at: string | null
          utm_campaign: string
        }
        Insert: {
          budget?: number | null
          campaign_name: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          platform?: string | null
          spend_to_date?: number | null
          start_date?: string | null
          updated_at?: string | null
          utm_campaign: string
        }
        Update: {
          budget?: number | null
          campaign_name?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          platform?: string | null
          spend_to_date?: number | null
          start_date?: string | null
          updated_at?: string | null
          utm_campaign?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcement_enabled: boolean
          birthday_reminder_enabled: boolean
          changelog_digest_enabled: boolean | null
          changelog_digest_frequency: string | null
          created_at: string
          email_notifications_enabled: boolean
          high_five_enabled: boolean
          id: string
          meeting_reminder_enabled: boolean
          program_reminder_enabled: boolean
          push_notifications_enabled: boolean | null
          streak_warning_enabled: boolean
          task_reminder_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_enabled?: boolean
          birthday_reminder_enabled?: boolean
          changelog_digest_enabled?: boolean | null
          changelog_digest_frequency?: string | null
          created_at?: string
          email_notifications_enabled?: boolean
          high_five_enabled?: boolean
          id?: string
          meeting_reminder_enabled?: boolean
          program_reminder_enabled?: boolean
          push_notifications_enabled?: boolean | null
          streak_warning_enabled?: boolean
          task_reminder_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_enabled?: boolean
          birthday_reminder_enabled?: boolean
          changelog_digest_enabled?: boolean | null
          changelog_digest_frequency?: string | null
          created_at?: string
          email_notifications_enabled?: boolean
          high_five_enabled?: boolean
          id?: string
          meeting_reminder_enabled?: boolean
          program_reminder_enabled?: boolean
          push_notifications_enabled?: boolean | null
          streak_warning_enabled?: boolean
          task_reminder_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_task_completions: {
        Row: {
          completed_at: string
          id: string
          task_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          task_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          task_key?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          title: string
          updated_at: string
          visible_to_roles: Database["public"]["Enums"]["app_role"][]
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          title: string
          updated_at?: string
          visible_to_roles?: Database["public"]["Enums"]["app_role"][]
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          title?: string
          updated_at?: string
          visible_to_roles?: Database["public"]["Enums"]["app_role"][]
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
      pass_usage_history: {
        Row: {
          created_at: string
          current_day_at_use: number
          day_missed: number
          enrollment_id: string
          id: string
          restore_reason: string | null
          restored_at: string | null
          restored_by: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day_at_use: number
          day_missed: number
          enrollment_id: string
          id?: string
          restore_reason?: string | null
          restored_at?: string | null
          restored_by?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_day_at_use?: number
          day_missed?: number
          enrollment_id?: string
          id?: string
          restore_reason?: string | null
          restored_at?: string | null
          restored_by?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_usage_history_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
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
      phorest_appointments: {
        Row: {
          appointment_date: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          end_time: string
          id: string
          is_new_client: boolean | null
          location_id: string | null
          notes: string | null
          phorest_client_id: string | null
          phorest_id: string
          phorest_staff_id: string | null
          service_category: string | null
          service_name: string | null
          start_time: string
          status: string
          stylist_user_id: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_new_client?: boolean | null
          location_id?: string | null
          notes?: string | null
          phorest_client_id?: string | null
          phorest_id: string
          phorest_staff_id?: string | null
          service_category?: string | null
          service_name?: string | null
          start_time: string
          status?: string
          stylist_user_id?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_new_client?: boolean | null
          location_id?: string | null
          notes?: string | null
          phorest_client_id?: string | null
          phorest_id?: string
          phorest_staff_id?: string | null
          service_category?: string | null
          service_name?: string | null
          start_time?: string
          status?: string
          stylist_user_id?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phorest_appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phorest_appointments_phorest_client_id_fkey"
            columns: ["phorest_client_id"]
            isOneToOne: false
            referencedRelation: "phorest_clients"
            referencedColumns: ["phorest_client_id"]
          },
          {
            foreignKeyName: "phorest_appointments_stylist_user_id_fkey"
            columns: ["stylist_user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_clients: {
        Row: {
          branch_name: string | null
          created_at: string
          email: string | null
          first_visit: string | null
          id: string
          is_vip: boolean | null
          last_visit: string | null
          lead_source: string | null
          location_id: string | null
          name: string
          notes: string | null
          phone: string | null
          phorest_branch_id: string | null
          phorest_client_id: string
          preferred_services: string[] | null
          preferred_stylist_id: string | null
          total_spend: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          branch_name?: string | null
          created_at?: string
          email?: string | null
          first_visit?: string | null
          id?: string
          is_vip?: boolean | null
          last_visit?: string | null
          lead_source?: string | null
          location_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          phorest_branch_id?: string | null
          phorest_client_id: string
          preferred_services?: string[] | null
          preferred_stylist_id?: string | null
          total_spend?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          branch_name?: string | null
          created_at?: string
          email?: string | null
          first_visit?: string | null
          id?: string
          is_vip?: boolean | null
          last_visit?: string | null
          lead_source?: string | null
          location_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          phorest_branch_id?: string | null
          phorest_client_id?: string
          preferred_services?: string[] | null
          preferred_stylist_id?: string | null
          total_spend?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "phorest_clients_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phorest_clients_preferred_stylist_id_fkey"
            columns: ["preferred_stylist_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_daily_sales_summary: {
        Row: {
          average_ticket: number | null
          branch_name: string | null
          created_at: string
          id: string
          location_id: string | null
          phorest_staff_id: string | null
          product_revenue: number | null
          service_revenue: number | null
          summary_date: string
          total_discounts: number | null
          total_products: number | null
          total_revenue: number | null
          total_services: number | null
          total_transactions: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          average_ticket?: number | null
          branch_name?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          phorest_staff_id?: string | null
          product_revenue?: number | null
          service_revenue?: number | null
          summary_date: string
          total_discounts?: number | null
          total_products?: number | null
          total_revenue?: number | null
          total_services?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          average_ticket?: number | null
          branch_name?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          phorest_staff_id?: string | null
          product_revenue?: number | null
          service_revenue?: number | null
          summary_date?: string
          total_discounts?: number | null
          total_products?: number | null
          total_revenue?: number | null
          total_services?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phorest_daily_sales_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_performance_metrics: {
        Row: {
          average_ticket: number | null
          created_at: string
          extension_clients: number
          id: string
          new_clients: number
          phorest_staff_id: string | null
          rebooking_rate: number | null
          retail_sales: number
          retention_rate: number | null
          service_count: number
          total_revenue: number
          updated_at: string
          user_id: string | null
          week_start: string
        }
        Insert: {
          average_ticket?: number | null
          created_at?: string
          extension_clients?: number
          id?: string
          new_clients?: number
          phorest_staff_id?: string | null
          rebooking_rate?: number | null
          retail_sales?: number
          retention_rate?: number | null
          service_count?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
          week_start: string
        }
        Update: {
          average_ticket?: number | null
          created_at?: string
          extension_clients?: number
          id?: string
          new_clients?: number
          phorest_staff_id?: string | null
          rebooking_rate?: number | null
          retail_sales?: number
          retention_rate?: number | null
          service_count?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "phorest_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_sales_transactions: {
        Row: {
          branch_name: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          discount_amount: number | null
          id: string
          item_category: string | null
          item_name: string
          item_type: string
          location_id: string | null
          payment_method: string | null
          phorest_staff_id: string | null
          phorest_transaction_id: string
          quantity: number | null
          stylist_user_id: string | null
          tax_amount: number | null
          total_amount: number
          transaction_date: string
          transaction_time: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          branch_name?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          item_category?: string | null
          item_name: string
          item_type: string
          location_id?: string | null
          payment_method?: string | null
          phorest_staff_id?: string | null
          phorest_transaction_id: string
          quantity?: number | null
          stylist_user_id?: string | null
          tax_amount?: number | null
          total_amount: number
          transaction_date: string
          transaction_time?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          branch_name?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          item_category?: string | null
          item_name?: string
          item_type?: string
          location_id?: string | null
          payment_method?: string | null
          phorest_staff_id?: string | null
          phorest_transaction_id?: string
          quantity?: number | null
          stylist_user_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string
          transaction_time?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phorest_sales_transactions_stylist_user_id_fkey"
            columns: ["stylist_user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_services: {
        Row: {
          category: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          phorest_branch_id: string
          phorest_service_id: string
          price: number | null
          requires_qualification: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          phorest_branch_id: string
          phorest_service_id: string
          price?: number | null
          requires_qualification?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          phorest_branch_id?: string
          phorest_service_id?: string
          price?: number | null
          requires_qualification?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      phorest_staff_mapping: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          phorest_branch_id: string | null
          phorest_branch_name: string | null
          phorest_staff_email: string | null
          phorest_staff_id: string
          phorest_staff_name: string | null
          show_on_calendar: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          phorest_branch_id?: string | null
          phorest_branch_name?: string | null
          phorest_staff_email?: string | null
          phorest_staff_id: string
          phorest_staff_name?: string | null
          show_on_calendar?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          phorest_branch_id?: string | null
          phorest_branch_name?: string | null
          phorest_staff_email?: string | null
          phorest_staff_id?: string
          phorest_staff_name?: string | null
          show_on_calendar?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phorest_staff_mapping_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phorest_staff_services: {
        Row: {
          created_at: string | null
          custom_duration_minutes: number | null
          custom_price: number | null
          id: string
          is_qualified: boolean | null
          phorest_branch_id: string
          phorest_service_id: string
          phorest_staff_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          is_qualified?: boolean | null
          phorest_branch_id: string
          phorest_service_id: string
          phorest_staff_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          is_qualified?: boolean | null
          phorest_branch_id?: string
          phorest_service_id?: string
          phorest_staff_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      phorest_sync_log: {
        Row: {
          api_endpoint: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          records_synced: number | null
          response_sample: string | null
          retry_count: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          api_endpoint?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_synced?: number | null
          response_sample?: string | null
          retry_count?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          api_endpoint?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_synced?: number | null
          response_sample?: string | null
          retry_count?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      phorest_transaction_items: {
        Row: {
          branch_name: string | null
          client_name: string | null
          created_at: string | null
          discount: number | null
          id: string
          item_category: string | null
          item_name: string
          item_type: string
          location_id: string | null
          phorest_client_id: string | null
          phorest_staff_id: string | null
          quantity: number | null
          stylist_user_id: string | null
          total_amount: number
          transaction_date: string
          transaction_id: string
          unit_price: number | null
        }
        Insert: {
          branch_name?: string | null
          client_name?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          item_category?: string | null
          item_name: string
          item_type: string
          location_id?: string | null
          phorest_client_id?: string | null
          phorest_staff_id?: string | null
          quantity?: number | null
          stylist_user_id?: string | null
          total_amount: number
          transaction_date: string
          transaction_id: string
          unit_price?: number | null
        }
        Update: {
          branch_name?: string | null
          client_name?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          item_category?: string | null
          item_name?: string
          item_type?: string
          location_id?: string | null
          phorest_client_id?: string | null
          phorest_staff_id?: string | null
          quantity?: number | null
          stylist_user_id?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phorest_transaction_items_stylist_user_id_fkey"
            columns: ["stylist_user_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      program_achievements: {
        Row: {
          achievement_type: string
          badge_color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          threshold: number
          title: string
        }
        Insert: {
          achievement_type: string
          badge_color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          threshold?: number
          title: string
        }
        Update: {
          achievement_type?: string
          badge_color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          threshold?: number
          title?: string
        }
        Relationships: []
      }
      program_configuration: {
        Row: {
          allow_manual_restart: boolean
          auto_restart_on_miss: boolean
          created_at: string
          grace_period_hours: number
          id: string
          is_active: boolean
          life_happens_passes_total: number
          logo_color: string | null
          logo_size: number | null
          logo_url: string | null
          program_name: string
          require_metrics_logging: boolean
          require_proof_upload: boolean
          total_days: number
          updated_at: string
          weekly_wins_interval: number
          welcome_cta_text: string | null
          welcome_eyebrow: string | null
          welcome_headline: string | null
          welcome_subheadline: string | null
        }
        Insert: {
          allow_manual_restart?: boolean
          auto_restart_on_miss?: boolean
          created_at?: string
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          life_happens_passes_total?: number
          logo_color?: string | null
          logo_size?: number | null
          logo_url?: string | null
          program_name?: string
          require_metrics_logging?: boolean
          require_proof_upload?: boolean
          total_days?: number
          updated_at?: string
          weekly_wins_interval?: number
          welcome_cta_text?: string | null
          welcome_eyebrow?: string | null
          welcome_headline?: string | null
          welcome_subheadline?: string | null
        }
        Update: {
          allow_manual_restart?: boolean
          auto_restart_on_miss?: boolean
          created_at?: string
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          life_happens_passes_total?: number
          logo_color?: string | null
          logo_size?: number | null
          logo_url?: string | null
          program_name?: string
          require_metrics_logging?: boolean
          require_proof_upload?: boolean
          total_days?: number
          updated_at?: string
          weekly_wins_interval?: number
          welcome_cta_text?: string | null
          welcome_eyebrow?: string | null
          welcome_headline?: string | null
          welcome_subheadline?: string | null
        }
        Relationships: []
      }
      program_daily_tasks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_required: boolean
          label: string
          task_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          label: string
          task_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          label?: string
          task_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_outcomes: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_pause_requests: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          pause_end_date: string | null
          pause_start_date: string | null
          reason: string
          requested_at: string
          requested_duration_days: number
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          pause_end_date?: string | null
          pause_start_date?: string | null
          reason: string
          requested_at?: string
          requested_duration_days?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          pause_end_date?: string | null
          pause_start_date?: string | null
          reason?: string
          requested_at?: string
          requested_duration_days?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_pause_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
      program_resources: {
        Row: {
          assignment_id: string | null
          created_at: string
          description: string | null
          display_order: number
          file_type: string
          file_url: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          week_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          file_type?: string
          file_url: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          week_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_resources_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "weekly_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_resources_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_rules: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_emphasized: boolean
          rule_number: number
          rule_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_emphasized?: boolean
          rule_number: number
          rule_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_emphasized?: boolean
          rule_number?: number
          rule_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_weeks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          end_day: number
          id: string
          is_active: boolean
          objective: string | null
          resources_json: Json | null
          start_day: number
          title: string
          updated_at: string
          video_url: string | null
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          end_day: number
          id?: string
          is_active?: boolean
          objective?: string | null
          resources_json?: Json | null
          start_day: number
          title: string
          updated_at?: string
          video_url?: string | null
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          end_day?: number
          id?: string
          is_active?: boolean
          objective?: string | null
          resources_json?: Json | null
          start_day?: number
          title?: string
          updated_at?: string
          video_url?: string | null
          week_number?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recruiting_pipeline_stages: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
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
      role_permission_defaults: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permission_defaults_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
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
      role_templates: {
        Row: {
          category: string
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          icon: string
          id: string
          is_system: boolean
          name: string
          permission_ids: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          icon?: string
          id?: string
          is_system?: boolean
          name: string
          permission_ids?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          icon?: string
          id?: string
          is_system?: boolean
          name?: string
          permission_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      salon_inquiries: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          consultation_booked_at: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          first_service_revenue: number | null
          id: string
          message: string | null
          name: string
          phone: string | null
          phorest_client_id: string | null
          preferred_location: string | null
          preferred_service: string | null
          preferred_stylist: string | null
          response_time_seconds: number | null
          source: Database["public"]["Enums"]["inquiry_source"]
          source_detail: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          consultation_booked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          first_service_revenue?: number | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          phorest_client_id?: string | null
          preferred_location?: string | null
          preferred_service?: string | null
          preferred_stylist?: string | null
          response_time_seconds?: number | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          consultation_booked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          first_service_revenue?: number | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          phorest_client_id?: string | null
          preferred_location?: string | null
          preferred_service?: string | null
          preferred_stylist?: string | null
          response_time_seconds?: number | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          source_detail?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_inquiries_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_inquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["user_id"]
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
      service_category_colors: {
        Row: {
          category_name: string
          color_hex: string
          created_at: string
          id: string
          text_color_hex: string
          updated_at: string
        }
        Insert: {
          category_name: string
          color_hex?: string
          created_at?: string
          id?: string
          text_color_hex?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          color_hex?: string
          created_at?: string
          id?: string
          text_color_hex?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_category_themes: {
        Row: {
          colors: Json
          created_at: string | null
          description: string | null
          id: string
          is_custom: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          colors: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      signature_presets: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      specialty_options: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      staff_strikes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          incident_date: string
          is_resolved: boolean
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          strike_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          incident_date?: string
          is_resolved?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          strike_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          incident_date?: string
          is_resolved?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          strike_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staffing_history: {
        Row: {
          assistant_count: number
          assistant_ratio: number | null
          created_at: string | null
          id: string
          location_id: string
          record_date: string
          stylist_capacity: number | null
          stylist_count: number
        }
        Insert: {
          assistant_count?: number
          assistant_ratio?: number | null
          created_at?: string | null
          id?: string
          location_id: string
          record_date?: string
          stylist_capacity?: number | null
          stylist_count?: number
        }
        Update: {
          assistant_count?: number
          assistant_ratio?: number | null
          created_at?: string | null
          id?: string
          location_id?: string
          record_date?: string
          stylist_capacity?: number | null
          stylist_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "staffing_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_levels: {
        Row: {
          client_label: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          client_label: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          client_label?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      stylist_personal_goals: {
        Row: {
          created_at: string
          id: string
          monthly_target: number
          notes: string | null
          updated_at: string
          user_id: string
          weekly_target: number
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_target?: number
          notes?: string | null
          updated_at?: string
          user_id: string
          weekly_target?: number
        }
        Update: {
          created_at?: string
          id?: string
          monthly_target?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
          weekly_target?: number
        }
        Relationships: []
      }
      stylist_program_enrollment: {
        Row: {
          completed_at: string | null
          created_at: string
          current_day: number
          forgive_credits_remaining: number
          forgive_credits_used: number
          id: string
          last_completion_date: string | null
          last_credit_used_at: string | null
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
          forgive_credits_remaining?: number
          forgive_credits_used?: number
          id?: string
          last_completion_date?: string | null
          last_credit_used_at?: string | null
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
          forgive_credits_remaining?: number
          forgive_credits_used?: number
          id?: string
          last_completion_date?: string | null
          last_credit_used_at?: string | null
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          custom_theme: Json | null
          custom_typography: Json | null
          id: string
          settings_layout: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_theme?: Json | null
          custom_typography?: Json | null
          id?: string
          settings_layout?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_theme?: Json | null
          custom_typography?: Json | null
          id?: string
          settings_layout?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_program_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          enrollment_id: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          enrollment_id: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          enrollment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "program_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_achievements_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
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
      website_analytics_cache: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string
          date: string
          fetched_at: string
          id: string
          pageviews: number
          visitors: number
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date: string
          fetched_at?: string
          id?: string
          pageviews?: number
          visitors?: number
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date?: string
          fetched_at?: string
          id?: string
          pageviews?: number
          visitors?: number
        }
        Relationships: []
      }
      weekly_assignment_completions: {
        Row: {
          assignment_id: string
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_complete: boolean
          notes: string | null
          proof_url: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_complete?: boolean
          notes?: string | null
          proof_url?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_complete?: boolean
          notes?: string | null
          proof_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_assignment_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "weekly_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_assignment_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "stylist_program_enrollment"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_required: boolean
          proof_type: string
          title: string
          updated_at: string
          week_id: string
        }
        Insert: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          proof_type?: string
          title: string
          updated_at?: string
          week_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          proof_type?: string
          title?: string
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_assignments_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
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
      can_view_leaderboard: { Args: { _user_id: string }; Returns: boolean }
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
        | "super_admin"
      day_rate_booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "no_show"
      inquiry_source:
        | "website_form"
        | "google_business"
        | "facebook_lead"
        | "instagram_lead"
        | "phone_call"
        | "walk_in"
        | "referral"
        | "other"
      inquiry_status:
        | "new"
        | "contacted"
        | "assigned"
        | "consultation_booked"
        | "converted"
        | "lost"
      lead_source:
        | "content"
        | "ads"
        | "referral"
        | "google"
        | "walkin"
        | "other"
        | "salon_lead"
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
        "super_admin",
      ],
      day_rate_booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "no_show",
      ],
      inquiry_source: [
        "website_form",
        "google_business",
        "facebook_lead",
        "instagram_lead",
        "phone_call",
        "walk_in",
        "referral",
        "other",
      ],
      inquiry_status: [
        "new",
        "contacted",
        "assigned",
        "consultation_booked",
        "converted",
        "lost",
      ],
      lead_source: [
        "content",
        "ads",
        "referral",
        "google",
        "walkin",
        "other",
        "salon_lead",
      ],
      program_status: ["active", "paused", "completed", "restarted"],
      stylist_type: ["independent", "commission", "salon_owner"],
      touchpoint_type: ["call", "text", "email", "social", "in_person"],
    },
  },
} as const
