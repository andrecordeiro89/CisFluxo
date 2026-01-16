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
      patient_steps: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          patient_id: string
          started_at: string | null
          station_number: number | null
          status: Database["public"]["Enums"]["patient_step_status"]
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_id: string
          started_at?: string | null
          station_number?: number | null
          status?: Database["public"]["Enums"]["patient_step_status"]
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          started_at?: string | null
          station_number?: number | null
          status?: Database["public"]["Enums"]["patient_step_status"]
          step?: Database["public"]["Enums"]["circuit_step"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_steps_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          completed_at: string | null
          created_at: string
          flow_type: string
          has_surgery_indication: boolean | null
          id: string
          is_being_served: boolean
          is_completed: boolean
          is_priority: boolean
          name: string
          needs_cardio: boolean
          needs_image_exam: boolean
          pending_surgery_scheduling: boolean | null
          registration_number: string | null
          scheduling_pending_at: string | null
          specialty: Database["public"]["Enums"]["medical_specialty"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          flow_type?: string
          has_surgery_indication?: boolean | null
          id?: string
          is_being_served?: boolean
          is_completed?: boolean
          is_priority?: boolean
          name: string
          needs_cardio?: boolean
          needs_image_exam?: boolean
          pending_surgery_scheduling?: boolean | null
          registration_number?: string | null
          scheduling_pending_at?: string | null
          specialty?: Database["public"]["Enums"]["medical_specialty"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          flow_type?: string
          has_surgery_indication?: boolean | null
          id?: string
          is_being_served?: boolean
          is_completed?: boolean
          is_priority?: boolean
          name?: string
          needs_cardio?: boolean
          needs_image_exam?: boolean
          pending_surgery_scheduling?: boolean | null
          registration_number?: string | null
          scheduling_pending_at?: string | null
          specialty?: Database["public"]["Enums"]["medical_specialty"]
        }
        Relationships: []
      }
      stations: {
        Row: {
          created_at: string
          current_patient_id: string | null
          current_specialty: string | null
          id: string
          is_active: boolean
          name: string
          station_number: number
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Insert: {
          created_at?: string
          current_patient_id?: string | null
          current_specialty?: string | null
          id?: string
          is_active?: boolean
          name: string
          station_number: number
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Update: {
          created_at?: string
          current_patient_id?: string | null
          current_specialty?: string | null
          id?: string
          is_active?: boolean
          name?: string
          station_number?: number
          step?: Database["public"]["Enums"]["circuit_step"]
        }
        Relationships: [
          {
            foreignKeyName: "stations_current_patient_id_fkey"
            columns: ["current_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_calls: {
        Row: {
          called_at: string
          id: string
          is_active: boolean
          patient_id: string
          patient_name: string
          station_name: string
          station_number: number
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Insert: {
          called_at?: string
          id?: string
          is_active?: boolean
          patient_id: string
          patient_name: string
          station_name: string
          station_number: number
          step: Database["public"]["Enums"]["circuit_step"]
        }
        Update: {
          called_at?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          patient_name?: string
          station_name?: string
          station_number?: number
          step?: Database["public"]["Enums"]["circuit_step"]
        }
        Relationships: [
          {
            foreignKeyName: "tv_calls_patient_id_fkey"
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
      get_next_patient_for_step: {
        Args: { target_step: Database["public"]["Enums"]["circuit_step"] }
        Returns: string
      }
    }
    Enums: {
      circuit_step:
        | "triagem_medica"
        | "exames_lab_ecg"
        | "agendamento"
        | "cardiologista"
        | "exame_imagem"
        | "especialista"
      medical_specialty:
        | "ORTOPEDIA"
        | "OTORRINO"
        | "OFTALMO"
        | "TRAUMA"
        | "GERAL"
        | "UROLOGIA"
        | "GINECOLOGIA"
        | "OUTROS"
      patient_step_status: "pending" | "called" | "in_progress" | "completed"
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
      circuit_step: [
        "triagem_medica",
        "exames_lab_ecg",
        "agendamento",
        "cardiologista",
        "exame_imagem",
        "especialista",
      ],
      medical_specialty: [
        "ORTOPEDIA",
        "OTORRINO",
        "OFTALMO",
        "TRAUMA",
        "GERAL",
        "UROLOGIA",
        "GINECOLOGIA",
        "OUTROS",
      ],
      patient_step_status: ["pending", "called", "in_progress", "completed"],
    },
  },
} as const
