import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Save, ArrowLeft } from 'lucide-react';

export default function PersonalDetails() {
    const navigate = useNavigate();
    const { user, updateCandidate } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fatherName: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        jobRole: '', // Added
        emergencyName: '',
        emergencyPhone: '',
        employeeId: '',
        joiningDate: '' // Added joining date
    });

    // Load saved data if available
    useEffect(() => {
        if (user?.personalDetails) {
            setFormData(prev => ({
                ...prev,
                ...user.personalDetails
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await updateCandidate({ personalDetails: formData });

        if (result.success) {
            // Keep localStorage as backup/cache if needed, or remove. 
            // Validating Requirement: "show in admin page" -> needs DB.
            alert('Details saved successfully!');
            navigate('/onboarding/bank-details');
        } else {
            alert('Failed to save details: ' + result.message);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-50/30 fade-in">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>

                <div className="mb-10 slide-up">
                    <StatusTracker currentStep={2} />
                </div>

                <div className="premium-card overflow-hidden slide-up">
                    <div className="p-8 border-b border-indigo-100 bg-indigo-50/30">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Personal Details</h1>
                        <p className="text-slate-500 mt-2 font-medium">Please fill in your correct information as per your official documents.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* Basic Info */}
                        <section>
                             <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                 Basic Information
                             </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">First Name</label>
                                     <input
                                         type="text"
                                         name="firstName"
                                         required
                                         placeholder="Enter first name"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.firstName}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Father's Name</label>
                                     <input
                                         type="text"
                                         name="fatherName"
                                         required
                                         placeholder="Enter father's name"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.fatherName}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Last Name</label>
                                     <input
                                         type="text"
                                         name="lastName"
                                         required
                                         placeholder="Enter last name"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.lastName}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Date of Birth</label>
                                     <input
                                         type="date"
                                         name="dob"
                                         required
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.dob}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Gender</label>
                                     <select
                                         name="gender"
                                         required
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.gender}
                                         onChange={handleChange}
                                     >
                                         <option value="">Select Gender</option>
                                         <option value="male">Male</option>
                                         <option value="female">Female</option>
                                         <option value="other">Other</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Job Role / Designation</label>
                                     <input
                                         type="text"
                                         name="jobRole"
                                         required
                                         placeholder="e.g. Software Engineer"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.jobRole}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Joining Date</label>
                                     <input
                                         type="date"
                                         name="joiningDate"
                                         required
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.joiningDate}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Employee ID</label>
                                     <input
                                         type="text"
                                         name="employeeId"
                                         required
                                         placeholder="Enter Employee ID"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.employeeId}
                                         onChange={handleChange}
                                     />
                                 </div>
                             </div>
                        </section>

                        {/* Contact Info */}
                        <section>
                             <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                 Contact Information
                             </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Address</label>
                                    <textarea
                                        name="address"
                                        rows={3}
                                        required
                                        placeholder="Full residential address"
                                        className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            placeholder="City"
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            placeholder="State"
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            required
                                            placeholder="ZIP Code"
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                            value={formData.zip}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Emergency Contact */}
                        <section>
                             <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                 Emergency Contact
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Contact Name</label>
                                     <input
                                         type="text"
                                         name="emergencyName"
                                         required
                                         placeholder="Person to contact in emergency"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.emergencyName}
                                         onChange={handleChange}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Contact Phone</label>
                                     <input
                                         type="tel"
                                         name="emergencyPhone"
                                         required
                                         placeholder="Emergency phone number"
                                         className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all"
                                         value={formData.emergencyPhone}
                                         onChange={handleChange}
                                     />
                                 </div>
                             </div>
                        </section>

                        <div className="pt-6 flex justify-center">
                             <button
                                 type="submit"
                                 className="w-full sm:w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 text-lg tracking-wider"
                             >
                                 SAVE AND CONTINUE
                             </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
