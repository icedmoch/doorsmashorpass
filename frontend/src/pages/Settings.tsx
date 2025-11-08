import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { calculateBMR, calculateTDEE } from "@/lib/calculations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    sex: "Male",
    height: "",
    weight: "",
    activityLevel: "3",
    dietaryPreferences: [] as string[],
    goals: "",
    goalCalories: "",
    goalProtein: "",
    goalCarbs: "",
    goalFat: "",
  });

  useEffect(() => {
    loadProfile();
    
    // Check if returning from Stripe Connect onboarding
    const connectStatus = searchParams.get('connect');
    if (connectStatus === 'success') {
      toast({
        title: "Stripe connected!",
        description: "You can now receive payments for deliveries",
      });
    } else if (connectStatus === 'refresh') {
      toast({
        title: "Setup incomplete",
        description: "Please complete your Stripe setup to receive payments",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setFormData({
          fullName: profile.full_name || "",
          age: profile.age?.toString() || "",
          sex: profile.sex || "Male",
          height: profile.height_inches?.toFixed(1) || "",
          weight: profile.weight_lbs?.toFixed(1) || "",
          activityLevel: profile.activity_level?.toString() || "3",
          dietaryPreferences: profile.dietary_preferences || [],
          goals: profile.goals || "",
          goalCalories: profile.goal_calories?.toString() || "",
          goalProtein: profile.goal_protein?.toString() || "",
          goalCarbs: profile.goal_carbs?.toString() || "",
          goalFat: profile.goal_fat?.toString() || "",
        });
        setStripeAccountId(profile.stripe_account_id || null);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const height = parseFloat(formData.height);
      const weight = parseFloat(formData.weight);
      const age = parseInt(formData.age);
      const activityLevel = parseInt(formData.activityLevel);

      // Calculate BMR and TDEE
      const bmr = calculateBMR(height, weight, age, formData.sex);
      const tdee = calculateTDEE(bmr, activityLevel);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          age: age,
          sex: formData.sex,
          height_inches: height,
          weight_lbs: weight,
          activity_level: activityLevel,
          bmr: bmr,
          tdee: tdee,
          dietary_preferences: formData.dietaryPreferences,
          goals: formData.goals,
          goal_calories: formData.goalCalories ? parseInt(formData.goalCalories) : null,
          goal_protein: formData.goalProtein ? parseFloat(formData.goalProtein) : null,
          goal_carbs: formData.goalCarbs ? parseFloat(formData.goalCarbs) : null,
          goal_fat: formData.goalFat ? parseFloat(formData.goalFat) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create Stripe account",
        variant: "destructive",
      });
    } finally {
      setIsConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl pt-24">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground mb-8">Update your personal information</p>

        {/* Stripe Connect Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payments for deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeAccountId ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Stripe Connected</p>
                  <p className="text-sm text-muted-foreground">You can now receive payments</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your bank account through Stripe to receive payments when delivering orders.
                </p>
                <Button 
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                  className="w-full sm:w-auto"
                >
                  {isConnectingStripe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect with Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Age */}
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Enter your age"
              min="1"
              max="150"
            />
          </div>

          {/* Sex */}
          <div>
            <Label>Sex</Label>
            <RadioGroup
              value={formData.sex}
              onValueChange={(value) => setFormData({ ...formData, sex: value })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male" className="font-normal">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female" className="font-normal">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other" className="font-normal">Other</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Height */}
          <div>
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              type="number"
              required
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="Enter height in inches"
              step="0.1"
            />
          </div>

          {/* Weight */}
          <div>
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="Enter weight in lbs"
              step="0.1"
            />
          </div>

          {/* Activity Level */}
          <div>
            <Label>Activity Level</Label>
            <p className="text-sm text-muted-foreground mb-2">
              How active are you on a typical day?
            </p>
            <RadioGroup
              value={formData.activityLevel}
              onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
              className="space-y-2"
            >
              {[
                { value: "1", label: "Sedentary", desc: "Little to no exercise" },
                { value: "2", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                { value: "3", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                { value: "4", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
                { value: "5", label: "Extremely Active", desc: "Very hard exercise & physical job" },
              ].map((level) => (
                <div key={level.value} className="flex items-center space-x-2 p-3 border border-border rounded-md hover:bg-accent transition-colors">
                  <RadioGroupItem value={level.value} id={`level-${level.value}`} />
                  <Label htmlFor={`level-${level.value}`} className="flex-1 font-normal cursor-pointer">
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.desc}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Dietary Preferences */}
          <div>
            <Label>Dietary Preferences</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select all that apply
            </p>
            <div className="space-y-2">
              {[
                { value: "vegetarian", label: "Vegetarian" },
                { value: "plant-based", label: "Plant Based" },
                { value: "local", label: "Local" },
                { value: "whole-grain", label: "Whole Grain" },
                { value: "halal", label: "Halal" },
                { value: "antibiotic-free", label: "Antibiotic Free" },
                { value: "sustainable", label: "Sustainable" },
              ].map((pref) => (
                <div key={pref.value} className="flex items-center space-x-2 p-3 border border-border rounded-md hover:bg-accent transition-colors">
                  <input
                    type="checkbox"
                    id={`pref-${pref.value}`}
                    checked={formData.dietaryPreferences.includes(pref.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          dietaryPreferences: [...formData.dietaryPreferences, pref.value]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          dietaryPreferences: formData.dietaryPreferences.filter(p => p !== pref.value)
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <Label htmlFor={`pref-${pref.value}`} className="flex-1 font-normal cursor-pointer">
                    {pref.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <Label htmlFor="goals">Goals</Label>
            <p className="text-sm text-muted-foreground mb-2">
              What are your health and fitness goals?
            </p>
            <textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="E.g., Lose weight, build muscle, maintain current weight, improve energy..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
            />
          </div>

          {/* Numeric Goals */}
          <div>
            <Label>Daily Nutrition Goals</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Set your target intake (optional)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goalCalories" className="text-sm font-normal">Calories</Label>
                <Input
                  id="goalCalories"
                  type="number"
                  value={formData.goalCalories}
                  onChange={(e) => setFormData({ ...formData, goalCalories: e.target.value })}
                  placeholder="e.g., 2000"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="goalProtein" className="text-sm font-normal">Protein (g)</Label>
                <Input
                  id="goalProtein"
                  type="number"
                  value={formData.goalProtein}
                  onChange={(e) => setFormData({ ...formData, goalProtein: e.target.value })}
                  placeholder="e.g., 150"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="goalCarbs" className="text-sm font-normal">Carbs (g)</Label>
                <Input
                  id="goalCarbs"
                  type="number"
                  value={formData.goalCarbs}
                  onChange={(e) => setFormData({ ...formData, goalCarbs: e.target.value })}
                  placeholder="e.g., 250"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="goalFat" className="text-sm font-normal">Fat (g)</Label>
                <Input
                  id="goalFat"
                  type="number"
                  value={formData.goalFat}
                  onChange={(e) => setFormData({ ...formData, goalFat: e.target.value })}
                  placeholder="e.g., 70"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/student/menu")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
