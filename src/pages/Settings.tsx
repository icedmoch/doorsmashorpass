import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { calculateBMR, calculateTDEE } from "@/lib/calculations";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    sex: "Male",
    height: "",
    weight: "",
    activityLevel: "3",
  });

  useEffect(() => {
    loadProfile();
  }, []);

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
        });
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
