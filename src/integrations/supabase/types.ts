export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_agreement_tokens: {
        Row: {
          agent_id: string | null
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_agreement_tokens_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_agreements: {
        Row: {
          agent_id: string | null
          agreed_at: string
          agreement_data: Json
          created_at: string
          digital_signature: string
          id: string
          ip_address: unknown | null
          status: string
          updated_at: string
          user_agent: string | null
          w9_file_name: string | null
          w9_file_path: string | null
          w9_file_size: number | null
        }
        Insert: {
          agent_id?: string | null
          agreed_at?: string
          agreement_data: Json
          created_at?: string
          digital_signature: string
          id?: string
          ip_address?: unknown | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          w9_file_name?: string | null
          w9_file_path?: string | null
          w9_file_size?: number | null
        }
        Update: {
          agent_id?: string | null
          agreed_at?: string
          agreement_data?: Json
          created_at?: string
          digital_signature?: string
          id?: string
          ip_address?: unknown | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          w9_file_name?: string | null
          w9_file_path?: string | null
          w9_file_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_agreements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          commission_rate: number | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          last_payment: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          last_payment?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          last_payment?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      carrier_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      carrier_quote_note_files: {
        Row: {
          carrier_quote_note_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
        }
        Insert: {
          carrier_quote_note_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
        }
        Update: {
          carrier_quote_note_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_quote_note_files_carrier_quote_note_id_fkey"
            columns: ["carrier_quote_note_id"]
            isOneToOne: false
            referencedRelation: "carrier_quote_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_quote_notes: {
        Row: {
          carrier_quote_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier_quote_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier_quote_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_quote_notes_carrier_quote_id_fkey"
            columns: ["carrier_quote_id"]
            isOneToOne: false
            referencedRelation: "carrier_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_quotes: {
        Row: {
          carrier: string
          circuit_quote_id: string
          color: string
          created_at: string
          display_order: number | null
          id: string
          install_fee: boolean | null
          install_fee_amount: number | null
          no_service: boolean | null
          notes: string | null
          other_costs: number | null
          price: number
          site_survey_needed: boolean | null
          slash_29: boolean | null
          speed: string
          static_ip: boolean | null
          static_ip_5: boolean | null
          static_ip_5_fee_amount: number | null
          static_ip_fee_amount: number | null
          term: string | null
          type: string
          updated_at: string
        }
        Insert: {
          carrier: string
          circuit_quote_id: string
          color?: string
          created_at?: string
          display_order?: number | null
          id?: string
          install_fee?: boolean | null
          install_fee_amount?: number | null
          no_service?: boolean | null
          notes?: string | null
          other_costs?: number | null
          price: number
          site_survey_needed?: boolean | null
          slash_29?: boolean | null
          speed: string
          static_ip?: boolean | null
          static_ip_5?: boolean | null
          static_ip_5_fee_amount?: number | null
          static_ip_fee_amount?: number | null
          term?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          carrier?: string
          circuit_quote_id?: string
          color?: string
          created_at?: string
          display_order?: number | null
          id?: string
          install_fee?: boolean | null
          install_fee_amount?: number | null
          no_service?: boolean | null
          notes?: string | null
          other_costs?: number | null
          price?: number
          site_survey_needed?: boolean | null
          slash_29?: boolean | null
          speed?: string
          static_ip?: boolean | null
          static_ip_5?: boolean | null
          static_ip_5_fee_amount?: number | null
          static_ip_fee_amount?: number | null
          term?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_quotes_circuit_quote_id_fkey"
            columns: ["circuit_quote_id"]
            isOneToOne: false
            referencedRelation: "circuit_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          default_selected: boolean
          description: string | null
          id: string
          is_active: boolean
          minimum_markup: number | null
          name: string
          type: Database["public"]["Enums"]["category_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_selected?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          minimum_markup?: number | null
          name: string
          type?: Database["public"]["Enums"]["category_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_selected?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          minimum_markup?: number | null
          name?: string
          type?: Database["public"]["Enums"]["category_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circuit_milestones: {
        Row: {
          circuit_tracking_id: string
          completed_date: string | null
          created_at: string
          id: string
          milestone_description: string | null
          milestone_name: string
          notes: string | null
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          circuit_tracking_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_description?: string | null
          milestone_name: string
          notes?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          circuit_tracking_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          notes?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_milestones_circuit_tracking_id_fkey"
            columns: ["circuit_tracking_id"]
            isOneToOne: false
            referencedRelation: "circuit_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_quote_categories: {
        Row: {
          category_name: string
          circuit_quote_id: string
          created_at: string
          id: string
        }
        Insert: {
          category_name: string
          circuit_quote_id: string
          created_at?: string
          id?: string
        }
        Update: {
          category_name?: string
          circuit_quote_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_quote_categories_circuit_quote_id_fkey"
            columns: ["circuit_quote_id"]
            isOneToOne: false
            referencedRelation: "circuit_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_quote_note_files: {
        Row: {
          circuit_quote_note_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
        }
        Insert: {
          circuit_quote_note_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
        }
        Update: {
          circuit_quote_note_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_quote_note_files_circuit_quote_note_id_fkey"
            columns: ["circuit_quote_note_id"]
            isOneToOne: false
            referencedRelation: "circuit_quote_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_quote_notes: {
        Row: {
          circuit_quote_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          circuit_quote_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          circuit_quote_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_quote_notes_circuit_quote_id_fkey"
            columns: ["circuit_quote_id"]
            isOneToOne: false
            referencedRelation: "circuit_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_quotes: {
        Row: {
          client_info_id: string | null
          client_name: string
          created_at: string
          deal_registration_id: string | null
          dhcp: boolean | null
          id: string
          location: string
          mikrotik_required: boolean | null
          slash_29: boolean | null
          static_ip: boolean | null
          status: string
          suite: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_info_id?: string | null
          client_name: string
          created_at?: string
          deal_registration_id?: string | null
          dhcp?: boolean | null
          id?: string
          location: string
          mikrotik_required?: boolean | null
          slash_29?: boolean | null
          static_ip?: boolean | null
          status?: string
          suite?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_info_id?: string | null
          client_name?: string
          created_at?: string
          deal_registration_id?: string | null
          dhcp?: boolean | null
          id?: string
          location?: string
          mikrotik_required?: boolean | null
          slash_29?: boolean | null
          static_ip?: boolean | null
          status?: string
          suite?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_quotes_client_info_id_fkey"
            columns: ["client_info_id"]
            isOneToOne: false
            referencedRelation: "client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_quotes_deal_registration_id_fkey"
            columns: ["deal_registration_id"]
            isOneToOne: false
            referencedRelation: "deal_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_tracking: {
        Row: {
          actual_completion_date: string | null
          circuit_type: string
          created_at: string
          estimated_completion_date: string | null
          id: string
          item_description: string | null
          item_name: string | null
          notes: string | null
          order_id: string
          progress_percentage: number | null
          quote_item_id: string | null
          stage: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          circuit_type: string
          created_at?: string
          estimated_completion_date?: string | null
          id?: string
          item_description?: string | null
          item_name?: string | null
          notes?: string | null
          order_id: string
          progress_percentage?: number | null
          quote_item_id?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          circuit_type?: string
          created_at?: string
          estimated_completion_date?: string | null
          id?: string
          item_description?: string | null
          item_name?: string | null
          notes?: string | null
          order_id?: string
          progress_percentage?: number | null
          quote_item_id?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circuit_tracking_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_type_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_addresses: {
        Row: {
          address_type: string
          city: string
          client_info_id: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          state: string
          street_address: string
          street_address_2: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          address_type?: string
          city: string
          client_info_id: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state: string
          street_address: string
          street_address_2?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          address_type?: string
          city?: string
          client_info_id?: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state?: string
          street_address?: string
          street_address_2?: string | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_client_info_id_fkey"
            columns: ["client_info_id"]
            isOneToOne: false
            referencedRelation: "client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_info_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          client_info_id: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_info_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_info_id_fkey"
            columns: ["client_info_id"]
            isOneToOne: false
            referencedRelation: "client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      client_info: {
        Row: {
          agent_id: string | null
          commission_override: number | null
          company_name: string
          created_at: string | null
          id: string
          notes: string | null
          revio_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          commission_override?: number | null
          company_name: string
          created_at?: string | null
          id?: string
          notes?: string | null
          revio_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          commission_override?: number | null
          company_name?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          revio_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_registration_note_files: {
        Row: {
          created_at: string
          deal_registration_note_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
        }
        Insert: {
          created_at?: string
          deal_registration_note_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
        }
        Update: {
          created_at?: string
          deal_registration_note_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_registration_note_files_deal_registration_note_id_fkey"
            columns: ["deal_registration_note_id"]
            isOneToOne: false
            referencedRelation: "deal_registration_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_registration_notes: {
        Row: {
          content: string
          created_at: string
          deal_registration_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deal_registration_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deal_registration_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_registration_notes_deal_registration_id_fkey"
            columns: ["deal_registration_id"]
            isOneToOne: false
            referencedRelation: "deal_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_registrations: {
        Row: {
          agent_id: string | null
          archived: boolean | null
          client_info_id: string | null
          created_at: string
          deal_name: string
          deal_value: number
          description: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          stage: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          archived?: boolean | null
          client_info_id?: string | null
          created_at?: string
          deal_name: string
          deal_value?: number
          description?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          archived?: boolean | null
          client_info_id?: string | null
          created_at?: string
          deal_name?: string
          deal_value?: number
          description?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_registrations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_registrations_client_info_id_fkey"
            columns: ["client_info_id"]
            isOneToOne: false
            referencedRelation: "client_info"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category_id: string | null
          charge_type: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sku: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          category_id?: string | null
          charge_type?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          category_id?: string | null
          charge_type?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          login_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          login_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          login_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          billing_address: string | null
          client_id: string | null
          client_info_id: string | null
          commission: number | null
          commission_override: number | null
          created_at: string
          id: string
          notes: string | null
          order_number: string
          quote_id: string
          service_address: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_address?: string | null
          client_id?: string | null
          client_info_id?: string | null
          commission?: number | null
          commission_override?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          quote_id: string
          service_address?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_address?: string | null
          client_id?: string | null
          client_info_id?: string | null
          commission?: number | null
          commission_override?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          quote_id?: string
          service_address?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          associated_agent_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_associated: boolean | null
          role: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          associated_agent_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_associated?: boolean | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          associated_agent_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_associated?: boolean | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_associated_agent"
            columns: ["associated_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_acceptances: {
        Row: {
          accepted_at: string
          client_email: string
          client_name: string
          created_at: string
          id: string
          ip_address: unknown | null
          quote_id: string
          signature_data: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          client_email: string
          client_name: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          quote_id: string
          signature_data: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          client_email?: string
          client_name?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          quote_id?: string
          signature_data?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_acceptances_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          address_id: string | null
          charge_type: string | null
          created_at: string
          id: string
          image_name: string | null
          image_url: string | null
          item_id: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          charge_type?: string | null
          created_at?: string
          id?: string
          image_name?: string | null
          image_url?: string | null
          item_id: string
          quantity?: number
          quote_id: string
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          charge_type?: string | null
          created_at?: string
          id?: string
          image_name?: string | null
          image_url?: string | null
          item_id?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "client_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_number_sequences: {
        Row: {
          created_at: string
          id: string
          last_quote_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_quote_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_quote_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          amount: number
          archived: boolean
          billing_address: string | null
          client_id: string | null
          client_info_id: string | null
          commission: number | null
          commission_override: number | null
          created_at: string | null
          date: string
          description: string | null
          email_open_count: number | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent_at: string | null
          email_status: string | null
          expires_at: string | null
          id: string
          notes: string | null
          quote_month: string | null
          quote_number: string | null
          quote_year: string | null
          service_address: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          amount: number
          archived?: boolean
          billing_address?: string | null
          client_id?: string | null
          client_info_id?: string | null
          commission?: number | null
          commission_override?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          email_open_count?: number | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          quote_month?: string | null
          quote_number?: string | null
          quote_year?: string | null
          service_address?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          amount?: number
          archived?: boolean
          billing_address?: string | null
          client_id?: string | null
          client_info_id?: string | null
          commission?: number | null
          commission_override?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          email_open_count?: number | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          quote_month?: string | null
          quote_number?: string | null
          quote_year?: string | null
          service_address?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_info_id_fkey"
            columns: ["client_info_id"]
            isOneToOne: false
            referencedRelation: "client_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      speeds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vendor_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          is_public: boolean
          updated_at: string
          uploaded_by: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          uploaded_by: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          uploaded_by?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_attachments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "vendor_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_attachments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "vendor_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_folders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_price_sheets: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          uploaded_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_price_sheets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          color: string | null
          created_at: string
          dba: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          rep_name: string | null
          sales_model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          dba?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          rep_name?: string | null
          sales_model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          dba?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          rep_name?: string | null
          sales_model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_bypass_rls: {
        Args: {
          p_quote_id: string
          p_order_number: string
          p_user_id: string
          p_amount: number
          p_status?: string
          p_commission?: number
          p_client_id?: string
          p_client_info_id?: string
          p_billing_address?: string
          p_service_address?: string
          p_notes?: string
          p_commission_override?: number
        }
        Returns: string
      }
      delete_quote: {
        Args: { quote_id: string }
        Returns: undefined
      }
      delete_transaction: {
        Args: { transaction_id: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_last_login: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          id: string
          full_name: string
          email: string
          role: string
          is_associated: boolean
          associated_agent_id: string
        }[]
      }
      make_user_admin: {
        Args: { user_id: string }
        Returns: undefined
      }
      make_user_associated: {
        Args: { user_id: string }
        Returns: undefined
      }
      permanently_delete_quote: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
      update_quote_status: {
        Args: { quote_id: string; new_status: string }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          _user_id: string
          _email: string
          _full_name: string
          _role: string
        }
        Returns: undefined
      }
    }
    Enums: {
      category_type: "Circuit" | "Network" | "Managed Services" | "AI" | "VOIP"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      category_type: ["Circuit", "Network", "Managed Services", "AI", "VOIP"],
    },
  },
} as const
