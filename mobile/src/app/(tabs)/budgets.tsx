import { PieChart } from "lucide-react-native";
import { Placeholder } from "@/components/Placeholder";

export default function BudgetsScreen() {
  return (
    <Placeholder
      title="Budgets"
      Icon={PieChart}
      tone="purple"
      subtitle="Category budgets with progress, over-budget alerts, and a smart suggestion card."
    />
  );
}
