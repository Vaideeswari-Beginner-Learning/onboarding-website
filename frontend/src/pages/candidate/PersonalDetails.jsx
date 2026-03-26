import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Save, ArrowLeft } from 'lucide-react';

export default function PersonalDetails() {
    const navigate = useNavigate();
    const { user, updateCandidate } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
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
        jobRole: '',
        emergencyName: '',
        emergencyPhone: '',
        employeeId: '',
        joiningDate: ''
    });

    const isSubmitted = !!(user?.personalDetails?.firstName);

    // Load saved data if available
    useEffect(() => {
        if (user?.personalDetails) {
            setFormData(prev => ({
                ...prev,
                ...user.personalDetails
            }));
            if (isSubmitted && !isEditing) {
                // Default to summary if already submitted
            }
        }
    }, [user, isSubmitted, isEditing]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await updateCandidate({ personalDetails: formData });

        if (result.success) {
            localStorage.setItem('onboarding_personal_details', 'true');
            setIsEditing(false);
            alert('Details saved successfully!');
            // Only navigate if it was the first time
            if (!isSubmitted) {
                navigate('/onboarding/bank-details');
            }
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
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors font-bold text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </button>

                <div className="mb-10 slide-up">
                    <StatusTracker currentStep={2} />
                </div>

                {isSubmitted && !isEditing ? (
                    /* Summary View */
                    <div className="premium-card overflow-hidden slide-up animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Personal Details</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Verified Status
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 font-black rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 text-sm"
                            >
                                EDIT DETAILS
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Personal Info Summary */}
                            <section>
                                <h3 className="text-sm font-black text-indigo-600 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                    Basic Information
                                    <div className="h-px bg-indigo-100 flex-1"></div>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                        <p className="text-lg font-bold text-slate-900">{formData.firstName} {formData.lastName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Father's Name</p>
                                        <p className="text-lg font-bold text-slate-900">{formData.fatherName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                                        <p className="text-lg font-black text-indigo-600">{formData.employeeId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</p>
                                        <p className="text-lg font-bold text-slate-900">{formData.dob}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                                        <p className="text-lg font-bold text-slate-900 capitalize">{formData.gender}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                                        <p className="text-lg font-bold text-slate-900">{formData.jobRole}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Contact Info Summary */}
                            <section>
                                <h3 className="text-sm font-black text-indigo-600 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                    Contact & Address
                                    <div className="h-px bg-indigo-100 flex-1"></div>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                        <p className="text-lg font-bold text-slate-900">{user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                                        <p className="text-lg font-bold text-slate-900">{formData.phone}</p>
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residential Address</p>
                                        <p className="text-lg font-bold text-slate-900 leading-relaxed">
                                            {formData.address}, {formData.city}, {formData.state} - {formData.zip}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Emergency Summary */}
                            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    Emergency Contact
                                </h3>
                                <div className="flex flex-wrap gap-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Name</p>
                                        <p className="text-base font-bold text-slate-900">{formData.emergencyName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                                        <p className="text-base font-bold text-slate-900">{formData.emergencyPhone}</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-8 bg-indigo-50/30 border-t border-indigo-100 flex justify-end">
                            <button 
                                onClick={() => navigate('/onboarding/bank-details')}
                                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 tracking-wider uppercase text-sm"
                            >
                                CONTINUE TO BANK DETAILS →
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form View */
                    <div className="premium-card overflow-hidden slide-up animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            pattern="^[A-Za-z][A-Za-z\s.]{2,49}$"
                                            title="Name must start with a letter and be 3-50 characters. Only letters, spaces and dots allowed (e.g. Vaideeswari.V)."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Father's Name</label>
                                        <input
                                            type="text"
                                            name="fatherName"
                                            required
                                            placeholder="Enter father's name"
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.fatherName}
                                            onChange={handleChange}
                                            pattern="^[A-Za-z][A-Za-z\s.]{2,49}$"
                                            title="Name must start with a letter and be 3-50 characters. Only letters, spaces and dots allowed."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            placeholder="Enter last name"
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            pattern="^[A-Za-z][A-Za-z\s.]{0,49}$"
                                            title="Last name must start with a letter. Only letters, spaces and dots allowed."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            required
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.dob}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Gender</label>
                                        <select
                                            name="gender"
                                            required
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </section>

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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                                value={formData.zip}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
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
                                            className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.emergencyPhone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                                {isSubmitted && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="w-full sm:w-1/3 bg-white border-2 border-indigo-100 text-indigo-600 font-black py-4 px-10 rounded-2xl shadow-lg transition-all hover:bg-indigo-50 active:scale-95 text-lg tracking-wider"
                                    >
                                        CANCEL
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className={`w-full ${isSubmitted ? 'sm:w-1/3' : 'sm:w-2/3'} bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 text-lg tracking-wider`}
                                >
                                    {isSubmitted ? 'UPDATE DETAILS' : 'SAVE AND CONTINUE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
