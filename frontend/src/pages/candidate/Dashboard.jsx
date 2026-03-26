import { motion } from 'framer-motion';
import { FileText, Upload, CheckSquare, Clock, Lock, ChevronRight } from 'lucide-react';
import { generateOfferLetter } from '../../utils/offerLetterGenerator';

export default function CandidateDashboard() {
    const { user } = useAuth();

    // Calculate current step based on completion from user object
    const getStep = () => {
        if (user?.documents?.length > 0) return 5; // All done
        if (user?.bankDetails?.accountNumber) return 4; // Documents
        if (user?.personalDetails?.phone) return 3; // Bank Details
        return 2; // Personal Details
    };

    const currentStep = getStep();

    const isPersonalDone = !!(user?.personalDetails?.phone);
    const isBankDone = !!(user?.bankDetails?.accountNumber);
    const isDocsDone = !!(user?.documents?.length > 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Welcome, <span className="text-indigo-600">{user?.name?.split(' ')[0] || 'Employee'}</span>
                    </h1>
                    <p className="mt-3 text-lg text-slate-500 font-medium max-w-2xl">
                        Your onboarding journey starts here. Complete the steps below to join the team.
                    </p>
                </motion.div>

                {/* Status Tracker */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2.5rem] p-8 md:p-10 mb-12 shadow-2xl shadow-indigo-100/50 border border-indigo-50/50"
                >
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>
                        Journey Progress
                    </h2>
                    <StatusTracker currentStep={currentStep} />
                </motion.div>

                {/* Action Cards */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >

                    {/* Personal Details Card */}
                    <motion.div variants={itemVariants}>
                        <Link to="/onboarding/personal-details" className="group block h-full">
                            <motion.div 
                                whileHover={{ y: -8, scale: 1.01 }}
                                className={`rounded-[2.5rem] p-1 h-full shadow-2xl transition-all duration-500 ${isPersonalDone
                                    ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-indigo-500/30'
                                    : 'bg-white border-2 border-slate-100 hover:border-indigo-200 shadow-slate-200/40'
                                    }`}>
                                <div className={`rounded-[2.2rem] p-8 h-full relative overflow-hidden flex flex-col ${isPersonalDone ? 'bg-white/5 backdrop-blur-sm' : 'bg-white'
                                    }`}>
                                    {/* Icon Background Textures */}
                                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                                        <FileText className={`w-48 h-48 ${isPersonalDone ? 'text-white' : 'text-indigo-600'}`} />
                                    </div>

                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:rotate-6 ${isPersonalDone
                                        ? 'bg-white text-indigo-600 shadow-indigo-900/20'
                                        : 'bg-indigo-50 text-indigo-600 shadow-indigo-200/50'
                                        }`}>
                                        {isPersonalDone ? <CheckSquare className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                    </div>

                                    <h3 className={`text-2xl font-black mb-4 transition-colors ${isPersonalDone ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'
                                        }`}>Personal Details</h3>
                                    
                                    <p className={`mb-8 text-sm font-medium leading-relaxed ${isPersonalDone ? 'text-indigo-100' : 'text-slate-500'
                                        }`}>Basic information, identity verification, and contact details.</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className={`text-sm font-black flex items-center gap-1 ${isPersonalDone ? 'text-white' : 'text-indigo-600'
                                            }`}>
                                            {isPersonalDone ? 'Completed • View' : 'Start Journey'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                        {isPersonalDone && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* Bank Details Card */}
                    <motion.div variants={itemVariants}>
                        {isPersonalDone ? (
                            <Link to="/onboarding/bank-details" className="group block h-full">
                                <motion.div 
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    className={`rounded-[2.5rem] p-1 h-full shadow-2xl transition-all duration-500 ${isBankDone
                                        ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 shadow-pink-500/30'
                                        : 'bg-white border-2 border-slate-100 hover:border-pink-200 shadow-slate-200/40'
                                        }`}>
                                    <div className={`rounded-[2.2rem] p-8 h-full relative overflow-hidden flex flex-col ${isBankDone ? 'bg-white/5 backdrop-blur-sm' : 'bg-white'
                                        }`}>
                                        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                                            <Upload className={`w-48 h-48 ${isBankDone ? 'text-white' : 'text-rose-500'}`} />
                                        </div>

                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:-rotate-6 ${isBankDone
                                            ? 'bg-white text-rose-600 shadow-rose-900/20'
                                            : 'bg-rose-50 text-rose-500 shadow-rose-200/50'
                                            }`}>
                                            {isBankDone ? <CheckSquare className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                        </div>

                                        <h3 className={`text-2xl font-black mb-4 transition-colors ${isBankDone ? 'text-white' : 'text-slate-900 group-hover:text-rose-600'
                                            }`}>Bank Details</h3>
                                        
                                        <p className={`mb-8 text-sm font-medium leading-relaxed ${isBankDone ? 'text-rose-100' : 'text-slate-500'
                                            }`}>Salary account settings and PAN card information.</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                            <span className={`text-sm font-black flex items-center gap-1 ${isBankDone ? 'text-white' : 'text-rose-600'
                                                }`}>
                                                {isBankDone ? 'Completed • View' : 'Setup Account'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            {isBankDone && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ) : (
                            <div className="h-full group">
                                <div className="rounded-[2.5rem] p-1 h-full bg-slate-100 border-2 border-dashed border-slate-200">
                                    <div className="rounded-[2.2rem] p-8 h-full bg-white/50 backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
                                            <Lock className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 mb-2">Bank Details</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                            Complete Personal Details to Unlock
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Document Upload Card */}
                    <motion.div variants={itemVariants}>
                        {isBankDone ? (
                            <Link to="/onboarding/documents" className="group block h-full">
                                <motion.div 
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    className={`rounded-[2.5rem] p-1 h-full shadow-2xl transition-all duration-500 ${isDocsDone
                                        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-orange-500/30'
                                        : 'bg-white border-2 border-slate-100 hover:border-orange-200 shadow-slate-200/40'
                                        }`}>
                                    <div className={`rounded-[2.2rem] p-8 h-full relative overflow-hidden flex flex-col ${isDocsDone ? 'bg-white/5 backdrop-blur-sm' : 'bg-white'
                                        }`}>
                                        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                                            <Upload className={`w-48 h-48 ${isDocsDone ? 'text-white' : 'text-orange-500'}`} />
                                        </div>

                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:rotate-12 ${isDocsDone
                                            ? 'bg-white text-orange-600 shadow-orange-900/20'
                                            : 'bg-orange-50 text-orange-500 shadow-orange-200/50'
                                            }`}>
                                            {isDocsDone ? <CheckSquare className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                        </div>

                                        <h3 className={`text-2xl font-black mb-4 transition-colors ${isDocsDone ? 'text-white' : 'text-slate-900 group-hover:text-orange-600'
                                            }`}>Documents Upload</h3>
                                        
                                        <p className={`mb-8 text-sm font-medium leading-relaxed ${isDocsDone ? 'text-orange-100' : 'text-slate-500'
                                            }`}>ID proofs, degrees, and employment history scanning.</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                            <span className={`text-sm font-black flex items-center gap-1 ${isDocsDone ? 'text-white' : 'text-orange-600'
                                                }`}>
                                                {isDocsDone ? 'Completed • View' : 'Upload Files'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            {isDocsDone && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ) : (
                            <div className="h-full group">
                                <div className="rounded-[2.5rem] p-1 h-full bg-slate-100 border-2 border-dashed border-slate-200">
                                    <div className="rounded-[2.2rem] p-8 h-full bg-white/50 backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
                                            <Lock className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 mb-2">Documents Upload</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                            Complete Bank Details to Unlock
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                </motion.div>


            </main>
        </div>
    );
}
