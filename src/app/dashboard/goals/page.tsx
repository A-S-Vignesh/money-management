// app/dashboard/goals/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  Plus,
  Target,
  Trophy,
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  PieChart,
  Edit,
  Trash2,
  ChevronDown,
  CircleDollarSign,
} from "lucide-react";
import {useGoalStore} from "@/store/useGoalStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useSession } from "next-auth/react";
import IGoal from "@/types/goal";

export default function GoalsPage() {
  const { data: session } = useSession();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoalStore();

  const { accounts } = useAccountStore();

  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<IGoal | null>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const categories = [
    "Emergency Fund",
    "Vacation",
    "New Car",
    "Home Purchase",
    "Education",
    "Wedding",
    "Other",
  ];
  const priorities = ["High", "Medium", "Low"];

  function calculateProgress(current: number, target: number) {
    if (!target || target <= 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(progress, 100); // cap at 100%
  }


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newGoal: IGoal = {
      name: formData.get("name") as string,
      target: Number(formData.get("target")),
      category: formData.get("category") as string,
      priority: formData.get("priority") as "Low" | "Medium" | "High", // 👈 enum/union
      deadline: new Date(formData.get("deadline") as string), // 👈 convert string → Date
      color: formData.get("color") as string,
    };

    if (editGoal && editGoal._id) {
      updateGoal(editGoal._id, newGoal);
    } else {
      addGoal(newGoal);
    }

    setEditGoal(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
  };

  const handleAddFunds = async (id: string, amount: number) => {
    const goal = goals.find((g) => g._id === id);
    if (!goal) return;

    const updated = {
      ...goal,
      current: Math.min(goal?.current || 0 + amount, goal.target),
    };
    updated.progress = Math.min(100, (updated.current / updated.target) * 100);

    await updateGoal(id, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const daysUntilDeadline = (deadline: string | Date) => {
    const today = new Date();
    const dateObj = new Date(deadline); // works for both string & Date
    const diffTime = dateObj.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


  const totalGoalsValue = goals.reduce((sum, g) => sum + g.target, 0);
  const totalSaved = goals.reduce((sum, g) => {
    const account = accounts.find((acc) => acc._id === g.accountId);
    return sum + (account?.balance || 0);
  }, 0);
  const overallProgress =
    totalGoalsValue > 0 ? (totalSaved / totalGoalsValue) * 100 : 0;

  const filteredGoals =
    filter === "all" ? goals : goals.filter((g) => g.priority === filter);

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (sortBy === "priority") {
      const order = { High: 1, Medium: 2, Low: 3 };
      return order[a.priority] - order[b.priority];
    } else if (sortBy === "deadline") {
      return a.deadline.getTime() - b.deadline.getTime();
    } else if (sortBy === "progress") {
      const aProg = (a.current || 0 / a.target) * 100;
      const bProg = (b.current || 0 / b.target) * 100;
      return bProg - aProg;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600">
            Set, track, and achieve your financial targets
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditGoal(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg mr-4">
              <Target className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">
                Active Goals
              </h3>
              <p className="text-2xl font-bold">{goals.length}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Working towards your dreams
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">
                Total Target
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(totalGoalsValue)}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">Across all goals</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <CircleDollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">
                Amount Saved
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalSaved)}
              </p>
            </div>
          </div>
          <div className="text-sm text-green-600">+12% last month</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-amber-100 p-3 rounded-lg mr-4">
              <PieChart className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">
                Overall Progress
              </h3>
              <p className="text-2xl font-bold">
                {overallProgress.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">Towards all goals</div>
        </div>
      </div>

      {/* Goals Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Goals
            </button>
            <button
              onClick={() => setFilter("High")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                filter === "High"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              High Priority
            </button>
            <button
              onClick={() => setFilter("Medium")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                filter === "Medium"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Medium Priority
            </button>
            <button
              onClick={() => setFilter("Low")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                filter === "Low"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Low Priority
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">Sort by:</span>
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedGoals.length > 0 ? (
          sortedGoals.map((goal) => {
            const daysLeft = daysUntilDeadline(goal.deadline);
            const account = accounts.find((acc) => acc._id === goal.accountId);
            const current = account?.balance || 0;
            const progress = calculateProgress(current, goal.target);
            const isCompleted = progress >= 100;
            const isUrgent = daysLeft < 30 && !isCompleted;

            return (
              <div
                key={goal._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 ${goal.color} rounded-lg flex items-center justify-center mr-3`}
                        >
                          <Flag className="text-white" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {goal.name}
                        </h2>
                      </div>
                      <div className="flex items-center mt-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            goal.priority === "High"
                              ? "bg-red-100 text-red-800"
                              : goal.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {goal.priority} Priority
                        </span>
                        <span className="ml-2 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                          {goal.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                        onClick={() => {
                          setEditGoal(goal);
                          setShowForm(true);
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100"
                        onClick={() => goal._id && deleteGoal(goal._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        Progress: {progress.toFixed(1)}%
                      </span>
                      <span className="font-medium">
                        {formatCurrency(current)} of{" "}
                        {formatCurrency(goal.target)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          progress >= 100
                            ? "bg-green-500"
                            : progress >= 75
                            ? "bg-blue-500"
                            : progress >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Deadline</div>
                      <div className="flex items-center">
                        <CalendarIcon
                          className="text-gray-500 mr-2"
                          size={16}
                        />
                        <span
                          className={`${
                            isUrgent
                              ? "text-red-600 font-medium"
                              : "text-gray-800"
                          }`}
                        >
                          {new Date(goal.deadline).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {!isCompleted && (
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              daysLeft < 0
                                ? "bg-red-100 text-red-800"
                                : daysLeft < 30
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {daysLeft < 0
                              ? Math.abs(daysLeft) + " days overdue"
                              : daysLeft + " days left"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Amount Needed
                      </div>
                      <div className="font-medium text-red-600">
                        {formatCurrency(goal.target - current)}
                      </div>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600">
                        To add funds, please go to the{" "}
                        <Link
                          href="/dashboard/transactions"
                          className="font-medium text-indigo-600 underline"
                        >
                          Transactions
                        </Link>{" "}
                        section.
                      </p>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mt-6 p-3 bg-green-50 rounded-lg flex items-center">
                      <Trophy className="text-green-600 mr-2" size={20} />
                      <span className="text-green-800 font-medium">
                        Goal achieved! Congratulations!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <Target className="text-gray-400 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No goals found
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {filter === "all"
                  ? "You haven't set any financial goals yet."
                  : `No goals found with ${filter} priority.`}
              </p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditGoal(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                <Plus size={16} />
                <span>Create Your First Goal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Completed Goals
          </h2>
        </div>
        <div className="p-6">
          {goals.filter((g) => (g?.current || 0 / g.target) * 100 >= 100)
            .length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {goals
                .filter((g) => g?.progress || 0 >= 100)
                .map((goal) => (
                  <div
                    key={goal._id}
                    className="border border-gray-200 rounded-lg p-5 flex items-center"
                  >
                    <div
                      className={`w-12 h-12 ${goal.color} rounded-lg flex items-center justify-center mr-4`}
                    >
                      <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{goal.name}</h3>
                      <p className="text-gray-600">
                        Completed on {new Date().toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(goal.target)}
                      </div>
                      <div className="text-sm text-gray-500">Achieved!</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No completed goals yet
              </h3>
              <p className="text-gray-500">
                Start working on your goals to see them here when completed
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <div className="flex items-start mb-3">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Target className="text-blue-600" size={20} />
            </div>
            <h3 className="font-medium text-blue-800">Goal Setting Tip #1</h3>
          </div>
          <p className="text-blue-700">
            Make your goals SMART: Specific, Measurable, Achievable, Relevant,
            and Time-bound.
          </p>
        </div>

        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <div className="flex items-start mb-3">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="font-medium text-green-800">Goal Setting Tip #2</h3>
          </div>
          <p className="text-green-700">
            Prioritize your goals and focus on 1-3 at a time to avoid feeling
            overwhelmed.
          </p>
        </div>

        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <div className="flex items-start mb-3">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <h3 className="font-medium text-purple-800">Goal Setting Tip #3</h3>
          </div>
          <p className="text-purple-700">
            Automate your savings by setting up recurring transfers to your goal
            accounts.
          </p>
        </div>
      </div>

      {/* Add/Edit Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editGoal ? "Edit Goal" : "Create New Goal"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditGoal(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editGoal?.name || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. Emergency Fund, Vacation"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="target"
                        defaultValue={editGoal?.target || ""}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="current"
                        defaultValue={editGoal?.current || "0"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div> */}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editGoal?.category || ""}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        defaultValue={editGoal?.priority || "Medium"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      defaultValue={
                        editGoal?.deadline
                          ? new Date(editGoal.deadline)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      name="color"
                      defaultValue={editGoal?.color || "bg-blue-500"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="bg-blue-500">Blue</option>
                      <option value="bg-green-500">Green</option>
                      <option value="bg-amber-500">Amber</option>
                      <option value="bg-purple-500">Purple</option>
                      <option value="bg-red-500">Red</option>
                      <option value="bg-teal-500">Teal</option>
                      <option value="bg-pink-500">Pink</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditGoal(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editGoal ? "Update" : "Create"} Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
