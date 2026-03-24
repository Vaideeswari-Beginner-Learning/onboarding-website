import React, { useState, useEffect, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Upload, FileText, CheckCircle, X, ArrowLeft, ArrowRight } from 'lucide-react';

const REQUIRED_DOCUMENTS = [
    { id: 'aadhaar', label: 'Aadhaar Card', type: 'PDF/Image' },
    { id: 'pan', label: 'PAN Card', type: 'PDF/Image' },
    { id: 'resume', label: 'Resume / CV', type: 'PDF' },
    { id: 'photo', label: 'Passport Size Photo', type: 'Image' },
    { id: 'degree', label: 'Degree Certificate', type: 'PDF' },
    { id: 'tenth', label: '10th Marksheet / Certificate', type: 'PDF/Image' },
    { id: 'twelfth', label: '12th Marksheet / Certificate', type: 'PDF/Image' },
    { id: 'experience', label: 'Experience Certificate', type: 'PDF' },
];

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("DocumentUpload Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600">Something went wrong.</h2>
                    <p className="text-slate-600">Please refresh the page or try again later.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

function DocumentUploadContent() {
    const navigate = useNavigate();
    const { user, updateCandidate, submitOnboarding } = useAuth();
    const [uploads, setUploads] = useState({});
    const [isFresher, setIsFresher] = useState(null);
    const [showThankYouPopup, setShowThankYouPopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (user?.documents && user.documents.length > 0) {
            const hasExperienceDoc = user.documents.some(d => d.type === 'Experience Certificate');
            setIsFresher(!hasExperienceDoc);

            const existingUploads = {};
            user.documents.forEach(doc => {
                const docDef = REQUIRED_DOCUMENTS.find(d => d.label === doc.type);
                if (docDef) {
                    existingUploads[docDef.id] = {
                        file: { name: doc.name },
                        status: 'done',
                        progress: 100
                    };
                }
            });
            setUploads(prev => ({ ...prev, ...existingUploads }));
        }
    }, [user]);

    const handleFileSelect = (docId, file) => {
        if (!file) return;

        // --- Strict File Type Validation ---
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = '.' + fileName.split('.').pop();

        // 1. Validate file type (PDF or Image only)
        if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(fileExtension)) {
            alert(`⚠️ Invalid File Type!\n\nOnly PDF and Image files (PDF, JPG, PNG) are accepted.\n\nYou uploaded: ${file.name}`);
            return;
        }

        // 2. Validate Aadhaar filename
        if (docId === 'aadhaar' && !fileName.includes('aadhaar')) {
            alert("⚠️ Invalid File: Please upload a valid Aadhaar Card.\nThe filename must contain 'aadhaar' (e.g., 'my_aadhaar.pdf').");
            return;
        }

        // 3. Validate PAN filename
        if (docId === 'pan' && !fileName.includes('pan')) {
            alert("⚠️ Invalid File: Please upload a valid PAN Card.\nThe filename must contain 'pan' (e.g., 'pan_card.pdf').");
            return;
        }

        // 4. Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`⚠️ File Too Large!\n\nMaximum file size is 5MB.\nYour file: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
            return;
        }
        // --- End Validation ---

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64String = e.target.result;
            setUploads(prev => ({
                ...prev,
                [docId]: {
                    file,
                    base64: base64String, // Store Base64
                    progress: 0,
                    status: 'uploading'
                }
            }));
            simulateUpload(docId);
        };
        reader.readAsDataURL(file);
    };

    const simulateUpload = (docId) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploads(prev => ({
                ...prev,
                [docId]: { ...prev[docId], progress }
            }));

            if (progress >= 100) {
                clearInterval(interval);
                setUploads(prev => ({
                    ...prev,
                    [docId]: { ...prev[docId], status: 'done', progress: 100 }
                }));
            }
        }, 200);
    };

    const handleDrop = (e, docId) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileSelect(docId, file);
    };

    const removeFile = (docId) => {
        setUploads(prev => {
            const newUploads = { ...prev };
            delete newUploads[docId];
            return newUploads;
        });
    };

    const filteredDocuments = REQUIRED_DOCUMENTS.filter(doc => {
        if (isFresher && doc.id === 'experience') return false;
        return true;
    });

    const allUploaded = filteredDocuments.every(doc => uploads[doc.id]?.status === 'done');

    if (isFresher === null) {
        return (
            <div className="min-h-screen bg-indigo-50/30 flex items-center justify-center p-4 fade-in">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Welcome! 👋</h2>
                    <p className="text-slate-600 mb-8">To customize your document checklist, please tell us about your experience level.</p>

                    <div className="space-y-4">
                        <button
                            onClick={() => setIsFresher(true)}
                            className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="font-bold text-slate-900 group-hover:text-blue-700">I am a Fresher</div>
                            <div className="text-sm text-slate-500">I have recently graduated and have no prior work experience.</div>
                        </button>

                        <button
                            onClick={() => setIsFresher(false)}
                            className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                        >
                            <div className="font-bold text-slate-900 group-hover:text-purple-700">I am Experienced</div>
                            <div className="text-sm text-slate-500">I have previous work experience and relevant certificates.</div>
                        </button>
                    </div>

                    <button onClick={() => navigate('/dashboard')} className="mt-8 text-slate-400 hover:text-slate-600 text-sm">
                        Go back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-indigo-50/30 relative fade-in">
            <Navbar />

            <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all ${showThankYouPopup ? 'blur-sm brightness-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/onboarding/bank-details')}
                        className="flex items-center px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Bank Details
                    </button>
                    <button
                        onClick={() => setIsFresher(null)}
                        className="flex items-center text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors"
                    >
                        Change Experience Level
                    </button>
                </div>

                <div className="mb-10 slide-up">
                    <StatusTracker currentStep={4} />
                </div>

                <div className="mb-10 flex justify-between items-end slide-up" style={{ animationDelay: '0.1s' }}>
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Upload Documents</h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {isFresher ? "As a Fresher, please submit your educational and identity documents." : "Please submit your experience letters along with your educational documents."}
                        </p>
                    </div>
                </div>

                {/* READ ONLY MODE */}
                {!isEditMode && user?.documents?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center text-emerald-600 font-bold">
                                <CheckCircle className="w-6 h-6 mr-2" />
                                <span>Documents Submitted Successfully</span>
                            </div>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                            >
                                Edit Documents
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {user.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <FileText className="w-5 h-5 text-slate-400 mr-3" />
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{doc.type}</p>
                                        <p className="text-xs text-slate-500">{doc.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* UPLOAD MODE */}
                {(isEditMode || !user?.documents?.length) && (
                    <>
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                            {filteredDocuments.map((doc) => {
                                const uploadState = uploads[doc.id];
                                return (
                                     <div
                                         key={doc.id}
                                         onDragOver={(e) => e.preventDefault()}
                                         onDrop={(e) => handleDrop(e, doc.id)}
                                         className={`premium-card p-8 border-2 border-dashed transition-all group ${uploadState?.status === 'done'
                                             ? 'border-emerald-500 bg-emerald-50/30 shadow-emerald-100'
                                             : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/10'
                                             }`}
                                     >
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{doc.label}</h3>
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
                                                    {doc.type}
                                                </span>
                                            </div>
                                            {uploadState?.status === 'done' ? (
                                                <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        {!uploadState ? (
                                            <div className="text-center py-6">
                                                <input
                                                    type="file"
                                                    id={`file-${doc.id}`}
                                                    className="hidden"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileSelect(doc.id, e.target.files[0])}
                                                />
                                                 <label
                                                     htmlFor={`file-${doc.id}`}
                                                     className="cursor-pointer inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                                                 >
                                                     <Upload className="w-5 h-5 mr-3" />
                                                     Select File
                                                 </label>
                                                <p className="text-xs text-slate-400 mt-4">or drag and drop here</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <div className="bg-slate-100 p-2 rounded-lg mr-3">
                                                            <FileText className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                                            {uploadState.file.name}
                                                        </span>
                                                    </div>
                                                    {uploadState.status === 'done' && (
                                                        <button onClick={() => removeFile(doc.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                     <div
                                                         className={`h-full transition-all duration-500 ${uploadState.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                         style={{ width: `${uploadState.progress}%` }}
                                                     ></div>
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {allUploaded && (
                            <div className="flex justify-center animate-in slide-in-from-bottom-8 duration-500 pb-20">
                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-lg w-full">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                        {isEditMode ? 'Save Changes' : 'All Documents Uploaded!'}
                                    </h3>
                                    <p className="text-slate-600 mb-8">Please confirm the details below before submitting.</p>

                                    <label className="flex items-center justify-center space-x-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors mb-8 text-left">
                                        <input type="checkbox" className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5 mt-0.5" id="declaration" />
                                        <span className="font-medium">I hereby declare that all the information and documents provided are true and correct.</span>
                                    </label>

                                    <button
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] flex items-center justify-center"
                                        onClick={async () => {
                                            const checkbox = document.getElementById('declaration');
                                            if (checkbox && checkbox.checked) {
                                                const uploadedDocs = filteredDocuments.map(doc => ({
                                                    name: uploads[doc.id]?.file?.name || `${doc.label}.pdf`,
                                                    type: doc.label,
                                                    size: (uploads[doc.id]?.file?.size / (1024 * 1024)).toFixed(2) + ' MB' || '1.2 MB',
                                                    status: 'Submitted',
                                                    url: uploads[doc.id]?.base64 || '' // Use Base64 instead of blob URL
                                                }));

                                                const result = await updateCandidate({
                                                    documents: uploadedDocs,
                                                    status: 'Submitted'
                                                });

                                                if (result.success) {
                                                    setShowThankYouPopup(true);
                                                    setIsEditMode(false); // Switch back to view mode
                                                } else {
                                                    alert('Failed to submit documents: ' + result.message);
                                                }
                                            } else {
                                                alert('Please confirm the declaration checkbox.');
                                            }
                                        }}
                                    >
                                        {isEditMode ? 'Update Documents' : 'Final Submit'} <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Thank You Popup */}
            {showThankYouPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

                    {/* Popup Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-5 rounded-b-[50%] transform -translate-y-16"></div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transform -translate-x-8 translate-y-8"></div>

                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce-slow ring-4 ring-white">
                                <CheckCircle className="w-12 h-12 text-emerald-600" />
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">All Done! 🎉</h2>
                            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mb-6"></div>

                            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                                Your documents have been successfully verified and submitted. You're all set for the next steps!
                            </p>

                            <button
                                onClick={() => {
                                    setShowThankYouPopup(false);
                                    navigate('/dashboard');
                                }}
                                className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center group"
                            >
                                Return to Dashboard
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DocumentUpload() {
    return (
        <ErrorBoundary>
            <DocumentUploadContent />
        </ErrorBoundary>
    );
}
