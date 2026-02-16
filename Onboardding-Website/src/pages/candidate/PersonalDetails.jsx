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
        emergencyPhone: ''
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
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>

                <div className="mb-8">
                    <StatusTracker currentStep={2} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-2xl font-bold text-slate-900">Personal Details</h1>
                        <p className="text-slate-600 mt-1">Please fill in your correct information as per your official documents.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* Basic Info */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">Basic Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                                    <input
                                        type="text"
                                        name="fatherName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.dob}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Role / Designation</label>
                                    <input
                                        type="text"
                                        name="jobRole"
                                        required
                                        placeholder="e.g. Software Engineer"
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.jobRole}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Contact Info */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">Contact Information</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        rows={3}
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            required
                                            className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                            value={formData.zip}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Emergency Contact */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">Emergency Contact</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        name="emergencyName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.emergencyName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="emergencyPhone"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.emergencyPhone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Save & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
