
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Benefits } from "@/components/clinical/Benefits";
import { HydrationBasics } from "@/components/clinical/HydrationBasics";
import { TipsSection } from "@/components/clinical/TipsSection";
import { ElectrolyteInfo } from "@/components/clinical/ElectrolyteInfo";

export default function ClinicalInfo() {
  return (
    <div className="min-h-screen bg-downscale-slate py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-downscale-brown mb-4">
            Clinical Information
          </h1>
          <p className="text-downscale-cream/80">
            Understanding the science behind hydration and weight loss
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <HydrationBasics />
          <ElectrolyteInfo />
          <Benefits />
          <TipsSection />
        </div>
      </div>
    </div>
  );
}
