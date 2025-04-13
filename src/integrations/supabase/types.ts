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
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ocr_results: {
        Row: {
          created_at: string | null
          document_path: string
          document_url: string
          extracted_data: Json
          id: string
          patient_id: string | null
          processed_by: string | null
          raw_text: string
        }
        Insert: {
          created_at?: string | null
          document_path: string
          document_url: string
          extracted_data: Json
          id?: string
          patient_id?: string | null
          processed_by?: string | null
          raw_text: string
        }
        Update: {
          created_at?: string | null
          document_path?: string
          document_url?: string
          extracted_data?: Json
          id?: string
          patient_id?: string | null
          processed_by?: string | null
          raw_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string | null
          document_path: string | null
          document_url: string | null
          dosage: string | null
          id: string
          medication: string | null
          ocr_result_id: string | null
          patient_id: string | null
          refills: number | null
        }
        Insert: {
          created_at?: string | null
          document_path?: string | null
          document_url?: string | null
          dosage?: string | null
          id?: string
          medication?: string | null
          ocr_result_id?: string | null
          patient_id?: string | null
          refills?: number | null
        }
        Update: {
          created_at?: string | null
          document_path?: string | null
          document_url?: string | null
          dosage?: string | null
          id?: string
          medication?: string | null
          ocr_result_id?: string | null
          patient_id?: string | null
          refills?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_medication_frequency: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          count: number
          percentage: number
        }[]
      }
      get_medications_by_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          count: number
        }[]
      }
      get_prescriptions_by_month: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
