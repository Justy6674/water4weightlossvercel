import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OtherHydrationOptionsProps {
  onAddHydration: (amount: number, label?: string) => void;
}

export const OtherHydrationOptions = ({ onAddHydration }: OtherHydrationOptionsProps) => {
  const drinkOptions = [
    { name: "Electrolyte Drink", ml: 250, hydrationFactor: 1.0, note: "Great for hydration!" },
    { name: "Coconut Water", ml: 250, hydrationFactor: 1.0, note: "Natural electrolytes" },
    { name: "Tea (Herbal)", ml: 250, hydrationFactor: 0.9, note: "Mild hydration (some caffeine)" },
    { name: "Coffee", ml: 250, hydrationFactor: 0.8, note: "Caffeine reduces hydration" },
    { name: "Soft Drink", ml: 375, hydrationFactor: 0.8, note: "High sugar, moderate hydration" },
    { name: "Milk", ml: 250, hydrationFactor: 0.8, note: "Good hydration but calorie dense" },
    { name: "Juice", ml: 250, hydrationFactor: 0.7, note: "High sugar, lower hydration" },
    { name: "Protein Shake", ml: 300, hydrationFactor: 0.8, note: "Calorie dense, mild hydration" },
    { name: "Sports Drink (e.g., Gatorade)", ml: 600, hydrationFactor: 0.9, note: "Good for heavy activity" },
    { name: "Alcohol (Beer, Wine)", ml: 150, hydrationFactor: 0.5, note: "Dehydrates you" },
    { name: "Soup/Broth", ml: 250, hydrationFactor: 0.9, note: "Good hydration and electrolytes" },
  ];

  const handleDrinkClick = (drink: typeof drinkOptions[number]) => {
    const effectiveMl = Math.round(drink.ml * drink.hydrationFactor);
    onAddHydration(effectiveMl, `${drink.name} (${effectiveMl}ml hydrated)`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6 space-y-4 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-800">Other Drinks</h2>
        <CardContent className="space-y-4">
          {drinkOptions.map((drink) => (
            <div key={drink.name} className="flex flex-col space-y-2">
              <Button 
                variant="outline"
                className="flex flex-col w-full items-start justify-start text-left"
                onClick={() => handleDrinkClick(drink)}
              >
                <span className="font-semibold">{drink.name}</span>
                <span className="text-sm text-gray-500">{drink.ml}ml ({Math.round(drink.hydrationFactor * 100)}% hydration)</span>
                <span className="text-xs text-gray-400 italic">{drink.note}</span>
              </Button>
            </div>
          ))}
          <div className="text-xs text-gray-500 text-center mt-4">
            Remember: Water is still the best choice!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
