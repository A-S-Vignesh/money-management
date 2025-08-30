import { CategoryName } from "@/utils/categories";

export default interface IBudget{
    _id?: string;
    name: string;
    category: CategoryName;
    allocated: number;
    spent?: number;
    period: "Weekly"|"Monthly"|"Quarterly"| "Yearly";
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string, optional
}