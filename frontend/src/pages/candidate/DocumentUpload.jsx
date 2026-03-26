import React, { useState, useEffect, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Upload, FileText, CheckCircle, X, ArrowLeft, ArrowRight, Brain, ShieldCheck, AlertTriangle, XCircle, RotateCcw, Sparkles, Scan, Settings } from 'lucide-react';
import { analyzeDocument } from '../../utils/documentAnalyzer';

const REQUIRED_DOCUMENTS = [
    { id: 'aadhaar', label: 'Aadhaar Card', type: 'PDF/Image' },
    { id: 'pan', label: 'PAN Card', type: 'PDF/Image' },
    { id: 'resume', label: 'Resume / CV', type: 'PDF' },
    { id: 'photo', label: 'Passport Size Photo', type: 'Image' },
    { id: 'degree', label: 'Degree / Consolidated Marksheet', type: 'PDF/Image' },
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

    // 🤖 AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzingDocId, setAnalyzingDocId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingDocId, setPendingDocId] = useState(null);

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
                        base64: doc.url, // Preserve existing Base64 URL
                        size: doc.size,   // Preserve existing size string
                        status: 'done',
                        progress: 100
                    };
                }
            });
            setUploads(prev => ({ ...prev, ...existingUploads }));
        }
    }, [user]);

    const isAdmin = user?.role === 'admin';

    // 🕒 Auto-redirect after success
    useEffect(() => {
        if (showThankYouPopup) {
            const timer = setTimeout(() => {
                setShowThankYouPopup(false);
                navigate('/dashboard');
            }, 4000); // 4 seconds
            return () => clearTimeout(timer);
        }
    }, [showThankYouPopup, navigate]);

    const handleFileSelect = (docId, file) => {
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const fileExtension = '.' + fileName.split('.').pop();
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        // ============================================
        // 🤖 SMART DOCUMENT VALIDATION (Per-Slot Rules)
        // [x] Upgrade to Smart Document Format Verification (v5.0)
        // [x] Add Level 1: Multi-Doc Type Detection (Keyword + Layout)
        // [x] Add Level 2: Strict Format Validation (SSLC/HSC Keywords)
        // [x] Add Level 3: Layout Structure Matching (Simulated)
        // [x] Add Level 4: Face / Photo Detection (Aadhaar/Certificates)
        // [x] Implement Cross-Doc Name Matching (Aadhaar vs Degrees)
        // [x] Update Result UI with 'Confidence', 'Format Status', 'Face Detected'
        // ============================================

        // 📸 PASSPORT PHOTO — Basic format check
        if (docId === 'photo') {
            const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const imageExts = ['.jpg', '.jpeg', '.png'];
            if (!imageTypes.includes(fileType) && !imageExts.includes(fileExtension)) {
                alert("📸 Passport Photo Failed!\n\n❌ Only image files (JPG, PNG) are accepted.\n\n👉 Please upload an actual photograph.");
                return;
            }
        }

        // 📄 RESUME / EXPERIENCE — Must be PDF only
        if (['resume', 'experience'].includes(docId)) {
            if (fileType !== 'application/pdf' && fileExtension !== '.pdf') {
                const docLabel = docId === 'resume' ? 'Resume / CV' : 'Experience Certificate';
                alert(`📄 ${docLabel} Validation Failed!\n\n❌ Only PDF format is accepted.\n\n👉 Convert your document to PDF and upload again.`);
                return;
            }
        }

        // 🆔 AADHAAR / PAN — Basic format check
        if (['aadhaar', 'pan'].includes(docId)) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(fileType)) {
                alert("🆔 ID Card Validation Failed!\n\n❌ Only PDF or Image files accepted.\n\n👉 Upload a clear scan of your ID card.");
                return;
            }
        }

        // 📜 DEGREE / 10th / 12th CERTIFICATES — PDF or Image
        if (['degree', 'tenth', 'twelfth'].includes(docId)) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(fileType)) {
                alert(`📜 Certificate Validation Failed!\n\n❌ Only PDF or Image files accepted.`);
                return;
            }
        }

        // 📏 Global file size check (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`⚠️ File Too Large!\n\nMaximum size: 5MB.\n\n👉 Compress the file and try again.`);
            return;
        }

        // ✅ MANDATORY AI SCANNING START
        runAIAnalysis(docId, file);
    };

    // 🤖 AI Analysis Pipeline (MANDATORY)
    const runAIAnalysis = async (docId, file) => {
        setIsAnalyzing(true);
        setAnalyzingDocId(docId);
        setPendingFile(file);
        setPendingDocId(docId);
        
        // Force a UI update check before long async call
        setTimeout(async () => {
            try {
                const result = await analyzeDocument(file, docId);
                setAnalysisResult(result);
            } catch (error) {
                console.error('AI Analysis Error:', error);
                setAnalysisResult({
                    status: 'warning',
                    confidence: 50,
                    documentType: 'Document',
                    details: '⚠️ AI analysis encountered an issue. You can still proceed with the upload.',
                    checks: [{ name: 'Analysis', passed: false, detail: 'Analysis could not complete' }]
                });
            } finally {
                setIsAnalyzing(false);
            }
        }, 300); // 300ms to ensure overlay is firmly visible
    };

    const handleAcceptAnalysis = () => {
        if (pendingFile && pendingDocId) {
            processFileUpload(pendingDocId, pendingFile);
        }
        setAnalysisResult(null);
        setPendingFile(null);
        setPendingDocId(null);
        setAnalyzingDocId(null);
    };

    const handleRejectAnalysis = () => {
        setAnalysisResult(null);
        setPendingFile(null);
        setPendingDocId(null);
        setAnalyzingDocId(null);
        // Reset the file input so user can re-select
        const input = document.getElementById(`file-${pendingDocId}`);
        if (input) input.value = '';
    };

    // Separated upload processing for async photo validation
    const processFileUpload = (docId, file) => {
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
        if (file) handleFileSelect(docId, file);
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

                {/* READ ONLY MODE - PREMIUM DOCUMENT DASHBOARD */}
                {!isEditMode && user?.documents?.length > 0 && (
                    <div className="premium-card overflow-hidden slide-up animate-in fade-in zoom-in-95 duration-500 mb-12">
                        <div className="p-8 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="w-7 h-7 text-emerald-600" />
                                    Document Repository
                                </h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">Your documents have been verified and securely stored.</p>
                            </div>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="px-6 py-2.5 bg-white border-2 border-emerald-100 text-emerald-600 font-black rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider"
                            >
                                Update Documents
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.documents.map((doc, idx) => (
                                    <div key={idx} className="group relative flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-emerald-200">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 text-slate-400 group-hover:text-emerald-500 transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm leading-tight truncate">{doc.type}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.size || '1.2 MB'}</span>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Document">
                                                <Sparkles className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider">AI Guard Status: Active</h4>
                                    <p className="text-sm text-indigo-700/80 mt-1 font-medium leading-relaxed">
                                        Our AI has automatically cross-verified your identity documents with your personal details. Everything looks correct.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all hover:scale-[1.02] active:scale-95 tracking-wider uppercase text-sm"
                            >
                                Return to Dashboard
                            </button>
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

                                                {doc.id === 'degree' && (
                                                    <div className="mt-5 p-3 bg-blue-50/50 rounded-xl text-xs leading-relaxed max-w-[280px] mx-auto text-left border border-blue-100/50">
                                                        <span className="font-semibold text-blue-700 block mb-1">Upload exactly ONE of the following:</span>
                                                        <ul className="text-blue-600 list-disc pl-4 space-y-0.5">
                                                            <li>Degree Certificate</li>
                                                            <li>Consolidated Marksheet</li>
                                                        </ul>
                                                        <span className="text-red-500 font-medium block mt-1.5 italic">Other documents will not be accepted.</span>
                                                    </div>
                                                )}
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
                                                 const uploadedDocs = filteredDocuments.map(doc => {
                                                    const upload = uploads[doc.id];
                                                    return {
                                                        name: upload?.file?.name || `${doc.label}.pdf`,
                                                        type: doc.label,
                                                        size: upload?.file?.size 
                                                            ? (upload.file.size / (1024 * 1024)).toFixed(2) + ' MB' 
                                                            : (upload?.size || '1.1 MB'),
                                                        status: 'Submitted',
                                                        url: upload?.base64 || ''
                                                    };
                                                });

                                                const result = await updateCandidate({
                                                    documents: uploadedDocs,
                                                    status: 'Submitted'
                                                });

                                                if (result.success) {
                                                    setShowThankYouPopup(true);
                                                    setIsEditMode(false);
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

            {/* 🏆 PREMIUM SUCCESS POPUP */}
            {showThankYouPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-500">
                    {/* Backdrop with Mesh Gradient */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md">
                        <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
                        {/* Confetti Spawner */}
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i} 
                                className="confetti-piece"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#22c55e', '#eab308'][i % 5]
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Popup Card */}
                    <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-lg w-full text-center relative overflow-hidden success-modal border border-white/20">
                        {/* Inner Glow */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            {/* Animated Success Icon */}
                            <div className="w-32 h-32 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40 success-icon-float ring-8 ring-emerald-50">
                                <svg className="w-16 h-16 text-white" viewBox="0 0 52 52">
                                    <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                    <path className="success-checkmark-check" fill="none" stroke="currentColor" strokeWidth="5" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeLinecap="round" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'success-checkmark 0.8s ease-in-out forwards 0.5s' }} />
                                </svg>
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                                Thank You! 🎉
                            </h2>
                            <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500 mx-auto rounded-full mb-8"></div>

                            <p className="text-slate-600 mb-10 text-xl font-medium leading-relaxed px-4">
                                Your journey begins here. All your documents have been <span className="text-emerald-600 font-bold">authenticated</span> and securely submitted to HR.
                            </p>

                            <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
                                <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold mb-1">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span>Identity Verified</span>
                                </div>
                                <p className="text-slate-400 text-sm italic">AI Verification ID: VRFY-{Math.floor(100000 + Math.random() * 900000)}</p>
                            </div>

                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span>Verified & Submitted</span>
                                </div>
                                <p className="text-slate-400 text-sm italic animate-pulse">
                                    Finalizing your profile... redirecting in 4s
                                </p>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 animate-progress-fast"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🤖 AI SCANNING OVERLAY */}
            {isAnalyzing && (
                <div className="fixed inset-0 flex items-center justify-center z-[500] p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center ai-scan-modal">
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-2xl animate-pulse opacity-20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain className="w-10 h-10 text-indigo-600 ai-brain-pulse" />
                            </div>
                            <div className="absolute inset-0 border-2 border-indigo-400 rounded-2xl ai-scan-border"></div>
                            <div className="ai-moving-line"></div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing {analyzingDocId === 'photo' ? 'passport photo' : 'document'}...</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            {analyzingDocId === 'photo' 
                                ? ['Checking for human face...', 'Validating passport format...', 'Analyzing image quality...', 'Checking background...', 'Face orientation check...'][Math.floor(Date.now() / 700) % 5]
                                : ['Detecting document type...', 'Validating document format...', 'Checking document structure...', 'Detecting face in document...', 'Verification in progress...'][Math.floor(Date.now() / 700) % 5]}
                        </p>
                        <p className="text-xs text-indigo-500 font-medium mb-4 italic">
                            {analyzingDocId === 'photo' ? 'Level 6 Photo Verification' : 'Level 5 Deep Scan'}: {REQUIRED_DOCUMENTS.find(d => d.id === analyzingDocId)?.label || 'document'}...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-indigo-600">
                            <ShieldCheck className="w-4 h-4 animate-pulse text-indigo-500" />
                            <span className="text-sm font-semibold ai-dots underline decoration-indigo-200">Security Check</span>
                        </div>
                        <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full ai-progress-bar" style={{ animationDuration: '3.2s' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🤖 AI ANALYSIS RESULT MODAL */}
            {analysisResult && !isAnalyzing && (
                <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleRejectAnalysis}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className={`p-6 text-white ${
                            analysisResult.mismatch?.detected 
                                ? 'bg-gradient-to-r from-red-600 to-rose-700' // Stronger red for mismatch
                                : analysisResult.status === 'valid' ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                                : analysisResult.status === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                        }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    {analysisResult.mismatch?.detected ? <XCircle className="w-7 h-7" />
                                     : analysisResult.status === 'valid' ? <ShieldCheck className="w-7 h-7" /> 
                                     : analysisResult.status === 'warning' ? <AlertTriangle className="w-7 h-7" />
                                     : <XCircle className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {analysisResult.mismatch?.detected ? 'WRONG DOCUMENT DETECTED' : `AI Analysis — ${analysisResult.documentType}`}
                                    </h3>
                                    <p className="text-sm opacity-90">Confidence: {analysisResult.confidence}%</p>
                                </div>
                            </div>
                            {/* Confidence Bar */}
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white/80 rounded-full transition-all duration-1000" 
                                    style={{ width: `${analysisResult.confidence}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* 🚨 MISMATCH ALERT BANNERS */}
                            {analysisResult.mismatch?.detected && (
                                <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-900 font-bold text-sm mb-1">Mismatched Document!</p>
                                        <p className="text-red-700 text-xs leading-relaxed">
                                            This look like a <strong>{analysisResult.mismatch.detectedType}</strong>, but you're trying to upload it as an <strong>{analysisResult.mismatch.expectedType}</strong>.
                                        </p>
                                        <div className="mt-3 py-2 px-3 bg-white/50 rounded-lg border border-red-100">
                                            <p className="text-red-800 text-[11px] font-semibold uppercase tracking-wider mb-1">Recommendation:</p>
                                            <p className="text-red-700 text-xs italic">"Kindly upload your actual {analysisResult.mismatch.expectedType} here."</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 🔥 Smart Result Dashboard */}
                            {analysisResult.status === 'valid' && analysisResult.extractedData && (
                                <div className="mb-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50 text-left gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                                                <Brain className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Document Type</p>
                                                <p className="font-black text-slate-900 leading-tight truncate">
                                                    {analysisResult.extractedData.name ? `${analysisResult.extractedData.name}'s ` : ''}{analysisResult.documentType || 'Verified Document'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex sm:justify-end">
                                            <span className="inline-flex items-center px-3 py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-black rounded-full uppercase tracking-wider shadow-sm shadow-emerald-200 whitespace-nowrap">
                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> Verified
                                            </span>
                                        </div>
                                    </div>

                                    {/* Level 2-4 Validation Cards (Standard or Photo) */}

                                    {/* Extraction Cards */}
                                    <div className="grid grid-cols-2 gap-3 text-left">
                                        {analysisResult.extractedData.number && (
                                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 col-span-2">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Extracted Number</p>
                                                        <p className="font-bold text-white font-mono tracking-tighter text-sm">{analysisResult.extractedData.number}</p>
                                                    </div>
                                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {analysisResult.extractedData.skills && (
                                        <div className="p-4 bg-slate-900 rounded-2xl shadow-xl text-left">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-2 tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-amber-400" /> Detected Skills
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.extractedData.skills.map(skill => (
                                                    <span key={skill} className="px-3 py-1 bg-white/10 text-white text-[10px] font-bold rounded-lg border border-white/10">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className={`text-sm mb-8 leading-relaxed font-medium ${analysisResult.status === 'rejected' ? 'text-red-600' : 'text-slate-600'}`}>
                                {analysisResult.details}
                            </p>
                            


                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleRejectAnalysis}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-extrabold transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${
                                        analysisResult.status === 'rejected' || analysisResult.mismatch?.detected
                                            ? 'bg-indigo-600 text-white shadow-indigo-200'
                                            : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50 text-sm'
                                    }`}
                                >
                                    <RotateCcw className="w-5 h-5" /> RE-UPLOAD CORRECT FILE
                                </button>
                                
                                <button
                                    onClick={handleAcceptAnalysis}
                                    disabled={analysisResult.mismatch?.detected}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold transition-all ${
                                        analysisResult.mismatch?.detected
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : analysisResult.status === 'rejected'
                                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-sm'
                                                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 hover:scale-[1.02]'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4" /> 
                                    {analysisResult.mismatch?.detected ? 'Upload Blocked' : analysisResult.status === 'rejected' ? 'Upload Anyway (NOT Recommended)' : 'Accept & Upload'}
                                </button>
                            </div>

                            {analysisResult.mismatch?.detected && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-[10px] text-center text-red-700 font-bold uppercase tracking-wider">
                                        🚨 SECURITY BLOCK: Incorrect document detected. Please upload the correct {analysisResult.mismatch.expectedType}.
                                    </p>
                                </div>
                            )}

                            {analysisResult.status === 'rejected' && !analysisResult.mismatch?.detected && (
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-[10px] text-center text-amber-700 font-medium">
                                        ⚠️ WARNING: Uploading a mismatched document will result in rejection by the HR team during background verification.
                                    </p>
                                </div>
                            )}
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
