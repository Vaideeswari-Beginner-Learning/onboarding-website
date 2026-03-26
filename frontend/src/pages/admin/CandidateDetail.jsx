import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, API_BASE } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Download, CheckCircle, XCircle, FileText, User, Eye, PartyPopper, Settings, Clock } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function CandidateDetail() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDonePopup, setShowDonePopup] = useState(false);
    const [appBaseUrl, setAppBaseUrl] = useState(localStorage.getItem('appBaseUrl') || window.location.origin);

    // --- Chat Hooks ---
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [suggestedUrl, setSuggestedUrl] = useState('');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [blobUrl, setBlobUrl] = useState(null);
    const chatEndRef = useRef(null);

    // Clean up blob URL on modal close or doc change
    useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    const handleViewDocument = (doc) => {
        // We rely on the useEffect for revocation to avoid race conditions
        // during the state transition which can crash the browser viewer.
        
        if (doc.url && doc.url.startsWith('data:')) {
            try {
                // Convert Base64 to Blob for robust viewing/downloading
                const parts = doc.url.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: contentType });
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (err) {
                console.error("Blob Conversion Error:", err);
                setBlobUrl(doc.url); // Fallback to raw URL
            }
        } else if (doc.url) {
            // If it's a relative path (legacy), prefix with backend URL
            let finalUrl = doc.url;
            if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:')) {
                const backendRoot = API_BASE.replace('/api', '');
                finalUrl = `${backendRoot}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
            }
            setBlobUrl(finalUrl); 
        } else {
            setBlobUrl(null);
        }
        
        setSelectedDoc(doc);
        setShowViewModal(true);
    };

    // --- Edit Mode States ---
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [tempPersonal, setTempPersonal] = useState({});
    const [tempBank, setTempBank] = useState({});
    const [savingDetails, setSavingDetails] = useState(false);


    // Fetch Candidate Details
    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/candidates/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                } else {
                    console.error('Failed to fetch candidate details');
                }
            } catch (error) {
                console.error('Error fetching candidate:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCandidate();

        // Fetch suggested IP for mobile testing
        const fetchSystemInfo = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/system-info`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.suggestedUrl) {
                        setSuggestedUrl(data.suggestedUrl);
                        if (appBaseUrl.includes('localhost')) {
                            setAppBaseUrl(data.suggestedUrl);
                            localStorage.setItem('appBaseUrl', data.suggestedUrl);
                        }
                    }
                }
            } catch (err) { console.log("System info fetch failed"); }
        };
        fetchSystemInfo();
    }, [id]);

    // Chat Logic - Fetch Messages
    useEffect(() => {
        if (!showChat || !candidate) return;

        const fetchMessages = async () => {
            try {
                const normalizedEmail = candidate.email.trim().toLowerCase();
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/messages/${normalizedEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [showChat, candidate]);

    // Chat Logic - Scroll to Bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showChat]);

    // Chat Logic - Send Message
    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMessage = {
            sender: 'admin',
            senderName: user?.name || 'HR Admin',
            receiver: candidate.email.trim().toLowerCase(),
            text: chatInput
        };

        setMessages(prev => [...prev, { ...newMessage, timestamp: Date.now() }]);
        setChatInput('');

        try {
            const token = localStorage.getItem('onboarding_token');
            await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMessage)
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };







    const getStableBaseUrl = (rawUrl) => {
        if (!rawUrl) return window.location.origin.replace(':5173', ':5000');
        let url = rawUrl.trim();
        if (url.includes(':5173')) {
            url = url.replace(':5173', ':5000');
        } else if (!url.includes(':5000') && !url.includes('localhost')) {
            const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
            if (ipv4Regex.test(url) && !url.includes(':')) {
                url = `${url}:5000`;
            }
        }
        return url;
    };






    const handleEditPersonal = () => {
        setTempPersonal({ ...candidate.personalDetails });
        setIsEditingPersonal(true);
    };

    const handleEditBank = () => {
        setTempBank({ ...candidate.bankDetails });
        setIsEditingBank(true);
    };

    const handleUpdateDetails = async (type) => {
        setSavingDetails(true);
        try {
            const token = localStorage.getItem('onboarding_token');
            const updateData = type === 'personal' ? { personalDetails: tempPersonal } : { bankDetails: tempBank };
            
            const response = await fetch(`${API_BASE}/api/candidates/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: candidate.email,
                    ...updateData
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCandidate(data.user);
                setIsEditingPersonal(false);
                setIsEditingBank(false);
                alert("✅ Details updated successfully!");
            } else {
                alert("❌ Failed to update details.");
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("❌ System error during update.");
        } finally {
            setSavingDetails(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (!candidate) {
        return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-xl font-bold mb-2">Candidate Not Found</h2>
            <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 hover:underline">Return to Dashboard</button>
        </div>;
    }

    const personal = candidate.personalDetails || {};
    const bank = candidate.bankDetails || {};
    const docs = candidate.documents || [];

    const handleDownloadAll = async () => {
        if (!candidate || !docs || docs.length === 0) {
            alert("No documents to download.");
            return;
        }

        const safeName = (candidate.name || candidate.email || 'Candidate').replace(/\s+/g, '_');
        console.log(`DEBUG: Starting Download All for ${safeName}. Total docs in array: ${docs.length}`);

        try {
            const zip = new JSZip();
            const folderName = `${safeName}_Documents`;
            const docsFolder = zip.folder(folderName);
            const usedNames = new Set();

            for (let idx = 0; idx < docs.length; idx++) {
                const doc = docs[idx];
                console.log(`DEBUG: Processing Doc ${idx + 1}: ${doc.name} (${doc.type})`);

                if (!doc.url) {
                    console.warn(`DEBUG: Skipping Doc ${idx + 1} - No URL found.`);
                    continue;
                }

                let fileData;
                let isBase64Encoded = false;

                if (doc.url.startsWith('data:')) {
                    fileData = doc.url.split(',')[1];
                    isBase64Encoded = true;
                    console.log(`DEBUG: Doc ${idx + 1} is Base64.`);
                } else {
                    let finalUrl = doc.url;
                    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:')) {
                        const backendRoot = API_BASE.replace('/api', '');
                        finalUrl = `${backendRoot}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
                    }
                    console.log(`DEBUG: Fetching remote doc from: ${finalUrl}`);

                    try {
                        const response = await fetch(finalUrl);
                        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
                        fileData = await response.arrayBuffer();
                        isBase64Encoded = false;
                    } catch (err) {
                        console.error(`ERROR: Failed to fetch ${doc.name}`, err);
                        continue;
                    }
                }

                if (fileData) {
                    let extension = '.pdf';
                    if (doc.url.startsWith('data:image/jpeg')) extension = '.jpg';
                    else if (doc.url.startsWith('data:image/png')) extension = '.png';
                    else if (doc.url.startsWith('data:image/')) extension = `.${doc.url.split(';')[0].split('/')[1]}`;
                    
                    let baseName = (doc.type || doc.name || 'Document').replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    
                    if (!baseName.toLowerCase().endsWith('.pdf') && 
                        !baseName.toLowerCase().endsWith('.jpg') && 
                        !baseName.toLowerCase().endsWith('.jpeg') && 
                        !baseName.toLowerCase().endsWith('.png')) {
                        baseName += extension;
                    }

                    let finalFileName = baseName;
                    let counter = 1;
                    while (usedNames.has(finalFileName)) {
                        const parts = baseName.split('.');
                        const ext = parts.pop();
                        finalFileName = `${parts.join('.')}_${counter}.${ext}`;
                        counter++;
                    }
                    usedNames.add(finalFileName);

                    console.log(`DEBUG: Adding ${finalFileName} to ZIP.`);
                    docsFolder.file(finalFileName, fileData, { base64: isBase64Encoded });
                }
            }

            if (usedNames.size === 0) {
                alert("⚠️ No valid document data found to download.");
                return;
            }

            console.log(`DEBUG: Generating ZIP with ${usedNames.size} files...`);
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${folderName}.zip`);
            alert(`✅ Successfully downloaded ${usedNames.size} documents in a single ZIP! 📄📥`);

        } catch (error) {
            console.error("ZIP Generation Error:", error);
            alert("❌ Failed to bundle documents. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />

            <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 transition-all ${showDonePopup || showChat || showViewModal ? 'blur-sm brightness-50' : ''}`}>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>



                {/* Header */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 md:flex justify-between items-center">
                        <div className="flex gap-6 items-center">
                            <div className="shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg shadow-blue-200">
                                {candidate.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{candidate.name}</h1>
                                 {personal.employeeId && (
                                     <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                         Employee ID: <span className="text-indigo-600">{personal.employeeId}</span>
                                     </p>
                                 )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                         Joining Date: {personal.joiningDate ? new Date(personal.joiningDate).toLocaleDateString() : 'Pending'}
                                     </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 mt-6 md:mt-0 sm:items-center">


                        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 mt-6 md:mt-0 sm:items-center">
                            <button className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:-translate-y-0.5" onClick={() => setShowChat(true)}>
                                <User className="w-4 h-4 mr-2" /> Chat
                            </button>
                        </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                    <div className="md:col-span-1 space-y-4 md:space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-slate-500" />
                                    Personal Details
                                </h3>
                                {!isEditingPersonal ? (
                                    <button onClick={handleEditPersonal} className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Settings className="w-3 h-3" /> Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingPersonal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">Cancel</button>
                                        <button onClick={() => handleUpdateDetails('personal')} disabled={savingDetails} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold uppercase disabled:opacity-50">Save</button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First Name</label>
                                    {isEditingPersonal ? (
                                        <input type="text" value={tempPersonal.firstName || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, firstName: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{personal.firstName || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Name</label>
                                    {isEditingPersonal ? (
                                        <input type="text" value={tempPersonal.lastName || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, lastName: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{personal.lastName || 'N/A'}</p>
                                    )}
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</label>
                                         {isEditingPersonal ? (
                                             <input type="text" value={tempPersonal.employeeId || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, employeeId: e.target.value })} className="w-full mt-1 p-2 text-sm border-indigo-200 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" />
                                         ) : (
                                             <div className="flex flex-col mt-1">
                                                <p className="text-sm text-indigo-700 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                                                    {personal.employeeId || 'NOT ASSIGNED'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase italic">Sys ID: {candidate.id}</p>
                                             </div>
                                         )}
                                     </div>
                                     <div>
                                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Joining Date</label>
                                         {isEditingPersonal ? (
                                             <input type="date" value={tempPersonal.joiningDate || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, joiningDate: e.target.value })} className="w-full mt-1 p-2 text-sm border-slate-200 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                         ) : (
                                             <div className="flex items-center gap-2 mt-1">
                                                 <Clock className="w-3 h-3 text-emerald-500" />
                                                 <p className="text-sm text-slate-900 font-black">{personal.joiningDate || 'NOT SET'}</p>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                                    <p className="text-sm text-slate-400 font-medium break-words italic">{candidate.email} (Non-editable)</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                                    {isEditingPersonal ? (
                                        <input type="text" value={tempPersonal.phone || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, phone: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{personal.phone || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                                    {isEditingPersonal ? (
                                        <input type="date" value={tempPersonal.dob || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, dob: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{personal.dob || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
                                    {isEditingPersonal ? (
                                        <select value={tempPersonal.gender || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, gender: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium capitalize">{personal.gender || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Role</label>
                                    {isEditingPersonal ? (
                                        <input type="text" value={tempPersonal.jobRole || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, jobRole: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{personal.jobRole || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                                    {isEditingPersonal ? (
                                        <div className="space-y-2 mt-1">
                                            <input type="text" placeholder="Street Address" value={tempPersonal.address || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, address: e.target.value })} className="w-full p-2 text-sm border rounded-lg" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="City" value={tempPersonal.city || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, city: e.target.value })} className="p-2 text-sm border rounded-lg" />
                                                <input type="text" placeholder="State" value={tempPersonal.state || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, state: e.target.value })} className="p-2 text-sm border rounded-lg" />
                                            </div>
                                            <input type="text" placeholder="Zip/Postal Code" value={tempPersonal.zip || ''} onChange={(e) => setTempPersonal({ ...tempPersonal, zip: e.target.value })} className="w-full p-2 text-sm border rounded-lg" />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-slate-900 font-medium">{personal.address || 'N/A'}</p>
                                            {personal.city && <p className="text-sm text-slate-500">{personal.city}, {personal.state} {personal.zip}</p>}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Contact</label>
                                    <p className="text-sm text-slate-900 font-medium">{personal.emergencyName || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{personal.emergencyPhone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                    Bank Details
                                </h3>
                                {!isEditingBank ? (
                                    <button onClick={handleEditBank} className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Settings className="w-3 h-3" /> Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingBank(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">Cancel</button>
                                        <button onClick={() => handleUpdateDetails('bank')} disabled={savingDetails} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold uppercase disabled:opacity-50">Save</button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Holder</label>
                                    {isEditingBank ? (
                                        <input type="text" value={tempBank.accountName || ''} onChange={(e) => setTempBank({ ...tempBank, accountName: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{bank.accountName || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation / Role</label>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {personal.jobRole || 'Not Specified'}
                                        </span>
                                    </div>
                                    {isEditingPersonal && <p className="text-[10px] text-slate-400 mt-1 italic">Update in Personal Details above</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank Name</label>
                                    {isEditingBank ? (
                                        <input type="text" value={tempBank.bankName || ''} onChange={(e) => setTempBank({ ...tempBank, bankName: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{bank.bankName || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Number</label>
                                    {isEditingBank ? (
                                        <input type="text" value={tempBank.accountNumber || ''} onChange={(e) => setTempBank({ ...tempBank, accountNumber: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-sm text-slate-900 font-medium">{bank.accountNumber || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IFSC Code</label>
                                        {isEditingBank ? (
                                            <input type="text" value={tempBank.ifscCode || ''} onChange={(e) => setTempBank({ ...tempBank, ifscCode: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        ) : (
                                            <p className="text-sm text-slate-900 font-medium">{bank.ifscCode || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PAN Number</label>
                                        {isEditingBank ? (
                                            <input type="text" value={tempBank.panNumber || ''} onChange={(e) => setTempBank({ ...tempBank, panNumber: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        ) : (
                                            <p className="text-sm text-slate-900 font-medium">{bank.panNumber || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 md:space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                Submitted Documents
                            </h3>
                            <div className="space-y-4">
                                {docs.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">No documents submitted yet.</p>
                                    </div>
                                ) : (
                                    docs.map((doc, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group gap-4">
                                            <div className="flex items-center">
                                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{doc.type} • {doc.size}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleViewDocument(doc)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 transition-all font-bold text-xs"
                                            >
                                                <Eye className="w-4 h-4" /> VIEW
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-4">
                            <button
                                onClick={handleDownloadAll}
                                disabled={!docs || docs.length === 0}
                                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <Download className="w-5 h-5 mr-2 text-slate-400" />
                                Download All
                            </button>
                        </div>
                    </div>
                </div>
            </main>



            {/* Chat Modal */}
            {showChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 font-bold border border-blue-400">
                                    {candidate.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{candidate.name}</h3>
                                    <p className="text-xs text-blue-100">{candidate.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="hover:bg-blue-700 p-1.5 rounded-lg transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-slate-400 mt-10">
                                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Start a conversation with {candidate.name}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} `}>
                                        <div className={`py-2 px-3 text-sm shadow-sm max-w-[80%] rounded-2xl ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            } `}>
                                            <p>{msg.text}</p>
                                            <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'admin' ? 'text-blue-100 text-right' : 'text-slate-400'} `}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Done Popup */}
            {showDonePopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden border border-slate-100">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <PartyPopper className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
                        <p className="text-slate-600 mb-8">The candidate's profile has been verified successfully.</p>
                        <button
                            onClick={() => {
                                setShowDonePopup(false);
                                navigate('/admin/dashboard');
                            }}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}




            {/* Document View Modal */}
            {showViewModal && selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowViewModal(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative z-20 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm truncate">{selectedDoc.name}</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedDoc.type} • {selectedDoc.size}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={blobUrl || selectedDoc.url} 
                                    download={selectedDoc.name}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button onClick={() => setShowViewModal(false)} className="hover:bg-red-500/20 p-2 rounded-lg transition-colors group">
                                    <XCircle className="w-6 h-6 text-slate-400 group-hover:text-red-400" />
                                </button>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                            {!selectedDoc.url ? (
                                <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <XCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">Preview Not Available</h4>
                                    <p className="text-sm text-slate-500 mb-6">This document was uploaded before the preview system was activated.</p>
                                    <div className="flex flex-col gap-3">
                                        <a 
                                            href={blobUrl || selectedDoc.url} 
                                            onClick={(e) => {
                                                if (!blobUrl && !selectedDoc.url) {
                                                    e.preventDefault();
                                                    alert("Document source not found in database.");
                                                }
                                            }}
                                            download={selectedDoc.name}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" /> DOWNLOAD TO VIEW
                                        </a>
                                        <button 
                                            onClick={() => setShowViewModal(false)}
                                            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs"
                                        >
                                            Close Preview
                                        </button>
                                    </div>
                                </div>
                            ) : (selectedDoc.url && selectedDoc.url.toLowerCase().includes('application/pdf')) || selectedDoc.name.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={blobUrl || selectedDoc.url} 
                                    className="w-full h-full border-none"
                                    title="PDF Document Viewer"
                                />
                            ) : (
                                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                                    <img 
                                        src={blobUrl || selectedDoc.url} 
                                        alt={selectedDoc.name}
                                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/800x1200?text=Error+Loading+Image";
                                        }}
                                    />
                                </div>
                            )}

                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] pointer-events-none select-none opacity-[0.03]">
                                <h4 className="text-8xl font-black text-slate-900 whitespace-nowrap">
                                    VAIDEESWARI VERIFIED
                                </h4>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                             <button 
                                onClick={() => setShowViewModal(false)}
                                className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
                             >
                                Close Preview
                             </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
