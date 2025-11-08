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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          created_at: string
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          calories: number
          created_at: string | null
          date: string | null
          dietary_fiber: number
          id: number
          location: string | null
          meal_type: string | null
          name: string
          protein: number
          serving_size: string
          sodium: number
          sugars: number
          total_carb: number
          total_fat: number
        }
        Insert: {
          calories: number
          created_at?: string | null
          date?: string | null
          dietary_fiber: number
          id?: number
          location?: string | null
          meal_type?: string | null
          name: string
          protein: number
          serving_size: string
          sodium: number
          sugars: number
          total_carb: number
          total_fat: number
        }
        Update: {
          calories?: number
          created_at?: string | null
          date?: string | null
          dietary_fiber?: number
          id?: number
          location?: string | null
          meal_type?: string | null
          name?: string
          protein?: number
          serving_size?: string
          sodium?: number
          sugars?: number
          total_carb?: number
          total_fat?: number
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          food_item_id: number
          id: number
          meal_category: string
          profile_id: string
          servings: number | null
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          food_item_id: number
          id?: number
          meal_category: string
          profile_id: string
          servings?: number | null
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          food_item_id?: number
          id?: number
          meal_category?: string
          profile_id?: string
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          dining_hall: string | null
          fat: number | null
          food_item_id: number
          food_item_name: string
          id: string
          order_id: string
          protein: number | null
          quantity: number
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          dining_hall?: string | null
          fat?: number | null
          food_item_id: number
          food_item_name: string
          id?: string
          order_id: string
          protein?: number | null
          quantity?: number
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          dining_hall?: string | null
          fat?: number | null
          food_item_id?: number
          food_item_name?: string
          id?: string
          order_id?: string
          protein?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          deliverer_id: string | null
          delivery_latitude: number | null
          delivery_location: string
          delivery_longitude: number | null
          delivery_option: string | null
          delivery_time: string | null
          id: string
          special_instructions: string | null
          special_notes: string | null
          status: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deliverer_id?: string | null
          delivery_latitude?: number | null
          delivery_location: string
          delivery_longitude?: number | null
          delivery_option?: string | null
          delivery_time?: string | null
          id?: string
          special_instructions?: string | null
          special_notes?: string | null
          status?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deliverer_id?: string | null
          delivery_latitude?: number | null
          delivery_location?: string
          delivery_longitude?: number | null
          delivery_option?: string | null
          delivery_time?: string | null
          id?: string
          special_instructions?: string | null
          special_notes?: string | null
          status?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: number | null
          age: number | null
          bmr: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          height_inches: number | null
          id: string
          onboarding_completed: boolean | null
          sex: string | null
          tdee: number | null
          weight_lbs: number | null
        }
        Insert: {
          activity_level?: number | null
          age?: number | null
          bmr?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          height_inches?: number | null
          id: string
          onboarding_completed?: boolean | null
          sex?: string | null
          tdee?: number | null
          weight_lbs?: number | null
        }
        Update: {
          activity_level?: number | null
          age?: number | null
          bmr?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          height_inches?: number | null
          id?: string
          onboarding_completed?: boolean | null
          sex?: string | null
          tdee?: number | null
          weight_lbs?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_order_totals: {
        Args: { order_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
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
      order_status: [
        "pending",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
