export default interface IGoal {
  _id?: string;
  accountId?: string;
  name: string;
  current?: number;
  progress?: number;
  target: number;
  category: string;
  priority: "Low" | "Medium" | "High";
  deadline: Date;
  color: string;
  isCompleted?: boolean;
}
