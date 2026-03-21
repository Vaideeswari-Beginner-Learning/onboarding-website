import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const steps = [
    { id: 1, name: 'Registration', status: 'completed' },
    { id: 2, name: 'Personal Details', status: 'current' },
    { id: 3, name: 'Bank Details', status: 'upcoming' },
    { id: 4, name: 'Documents', status: 'upcoming' },
];

export default function StatusTracker({ currentStep = 2 }) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
                ></div>

                {steps.map((step) => {
                    let icon = <Circle className="w-6 h-6 text-slate-300 bg-white" />; // Default: Hidden/Inactive
                    let colorClass = "text-slate-400";
                    let bgClass = "bg-white border-slate-200 opacity-50"; // Faded/Hidden look for future steps

                    // Completed Steps
                    if (step.id < currentStep) {
                        if (step.id === 1) { // Registration (Done)
                            icon = <CheckCircle className="w-6 h-6 text-white" />;
                            bgClass = "bg-green-500 border-green-500 shadow-lg shadow-green-500/30";
                            colorClass = "text-green-600 font-bold";
                        } else if (step.id === 2) { // Personal Details (Completed -> Blue/Indigo)
                            icon = <CheckCircle className="w-6 h-6 text-white" />;
                            bgClass = "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent shadow-lg shadow-indigo-500/30";
                            colorClass = "text-indigo-600 font-bold";
                        } else if (step.id === 3) { // Bank Details (Completed -> Pink/Rose)
                            icon = <CheckCircle className="w-6 h-6 text-white" />;
                            bgClass = "bg-gradient-to-r from-pink-500 to-rose-500 border-transparent shadow-lg shadow-pink-500/30";
                            colorClass = "text-pink-600 font-bold";
                        }
                    }
                    // Current Step
                    else if (step.id === currentStep) {
                        icon = <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
                        colorClass = "text-blue-600 font-bold";
                        bgClass = "bg-white border-blue-600 ring-4 ring-blue-50 opacity-100 scale-110";
                    }
                    // Upcoming Steps (remain hidden/faded as per user request)

                    return (
                        <div key={step.id} className="flex flex-col items-center z-10">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bgClass}`}>
                                {icon}
                            </div>
                            <span className={`mt-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${colorClass} hidden sm:block`}>
                                {step.name}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="sm:hidden mt-4 text-center">
                <p className="text-sm font-medium text-slate-700">
                    {currentStep > steps.length
                        ? "Onboarding Complete"
                        : `Step ${currentStep}: ${steps[currentStep - 1]?.name}`}
                </p>
            </div>
        </div>
    );
}
