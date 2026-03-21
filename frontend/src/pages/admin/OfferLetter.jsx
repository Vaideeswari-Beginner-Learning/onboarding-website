import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Download, Printer } from 'lucide-react';

export default function OfferLetter() {
    const navigate = useNavigate();
    // Mock data, in real app this would come from state/API
    const letterData = {
        name: "Alice Johnson",
        role: "Software Engineer",
        salary: "12,00,000",
        date: new Date().toLocaleDateString(),
        joiningDate: "2023-11-01",
        company: "Acme Corp"
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="print:hidden">
                <Navbar />
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:p-0 print:max-w-none">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <button
                        onClick={() => navigate('/admin/candidate/1')}
                        className="flex items-center text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                        >
                            <Printer className="w-4 h-4 mr-2" /> Print
                        </button>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                        </button>
                    </div>
                </div>

                {/* Letter Preview */}
                <div className="bg-white shadow-lg p-10 md:p-16 rounded-xl print:shadow-none print:p-12 text-slate-900 border border-slate-100 print:border-none">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1">{letterData.company}</h1>
                            <p className="text-sm text-slate-500">Tech Park, Silicon Valley, CA</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">OFFER LETTER</p>
                            <p className="text-sm text-slate-500">Date: {letterData.date}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 text-lg leading-relaxed">
                        <p>Dear <strong>{letterData.name}</strong>,</p>

                        <p>
                            We are pleased to offer you the position of <strong>{letterData.role}</strong> at <strong>{letterData.company}</strong>.
                            We were impressed with your skills and experience and believe you will be a valuable asset to our team.
                        </p>

                        <p>
                            Your annual Cost to Company (CTC) will be <strong>₹{letterData.salary}</strong>.
                            Your expected joining date is <strong>{letterData.joiningDate}</strong>.
                        </p>

                        <h3 className="text-xl font-bold pt-4">Terms & Conditions:</h3>
                        <ul className="list-disc pl-6 space-y-2 text-base">
                            <li>This offer is valid for 7 days from the date of issue.</li>
                            <li>You will be on a probation period of 6 months.</li>
                            <li>Employment is subject to successful background verification.</li>
                            <li>You agree to abide by the company's code of conduct and policies.</li>
                        </ul>

                        <p className="pt-4">
                            Please sign and return the duplicate copy of this letter as a token of your acceptance.
                            We look forward to welcoming you to the team!
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="mt-20 flex justify-between items-end">
                        <div>
                            <div className="h-16 w-32 mb-2">
                                {/* Mock Signature */}
                                <div className="font-script text-2xl text-blue-800 italic transform -rotate-6">Authorized Signatory</div>
                            </div>
                            <div className="border-t border-slate-400 pt-2 w-48">
                                <p className="font-bold">Authorized Signatory</p>
                                <p className="text-sm text-slate-500">{letterData.company}</p>
                            </div>
                        </div>

                        <div>
                            <div className="border-t border-slate-400 pt-2 w-48 mt-16">
                                <p className="font-bold">Candidate Signature</p>
                                <p className="text-sm text-slate-500">{letterData.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-6 border-t border-slate-100 text-center text-sm text-slate-400">
                        <p>{letterData.company} • www.example.com • +1 (555) 000-0000</p>
                    </div>
                </div>

            </main>
        </div>
    );
}
