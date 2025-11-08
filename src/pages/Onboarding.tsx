import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { calculateBMR, calculateTDEE } from "@/lib/calculations";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    sex: "Male",
    height: "",
    weight: "",
    activityLevel: "3",
    dietaryPreferences: [] as string[],
    goals: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
          age: age,
          sex: formData.sex,
          height_inches: height,
          weight_lbs: weight,
          activity_level: activityLevel,
          bmr: bmr,
          tdee: tdee,
          dietary_preferences: formData.dietaryPreferences,
          goals: formData.goals,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Your information has been saved.",
      });

      navigate("/student/menu");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Let's personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                { value: "vegan", label: "Vegan" },
                { value: "gluten-free", label: "Gluten Free" },
                { value: "keto", label: "Keto" },
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
