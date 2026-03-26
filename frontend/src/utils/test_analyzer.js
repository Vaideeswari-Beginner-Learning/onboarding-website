
// Mocking the environment for testing documentAnalyzer.js logic
const DOCUMENT_SIGNATURES = {
    aadhaar: { label: 'Aadhaar Card', filenameKeywords: ['aadhaar', 'aadhar', 'uid', 'uidai'] },
    resume: { label: 'Resume / CV', filenameKeywords: ['resume', 'cv', 'curriculum', 'vitae'] }
};

async function testMismatchDetection(fileName, targetDocId) {
    console.log(`\nTesting: File "${fileName}" in slot "${targetDocId}"`);
    
    // Simulating detectDocumentType
    const scores = {};
    for (const [docType, sig] of Object.entries(DOCUMENT_SIGNATURES)) {
        scores[docType] = 0;
        for (const keyword of sig.filenameKeywords) {
            if (fileName.toLowerCase().includes(keyword)) {
                scores[docType] += 30;
                break;
            }
        }
    }
    
    // Convert scores to list
    const detectedTypes = Object.entries(scores)
        .map(([docType, score]) => ({ docType, label: DOCUMENT_SIGNATURES[docType].label, score }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score);
    
    console.log("Detected Types:", JSON.stringify(detectedTypes));

    if (detectedTypes.length > 0) {
        const topDetection = detectedTypes[0];
        const targetScore = detectedTypes.find(d => d.docType === targetDocId)?.score || 0;
        
        console.log(`Top: ${topDetection.docType} (${topDetection.score}), Target: ${targetDocId} (${targetScore})`);

        if (topDetection.docType !== targetDocId && topDetection.score > 20 && topDetection.score > targetScore + 10) {
            console.log(">>> RESULT: MISMATCH DETECTED! ✅");
            return true;
        }
    }
    console.log(">>> RESULT: No mismatch detected ❌");
    return false;
}

testMismatchDetection('aadhaar.pdf.pdf', 'resume');
testMismatchDetection('my_cv.pdf', 'aadhaar');
testMismatchDetection('resume_final.pdf', 'resume');
testMismatchDetection('pancard.jpg', 'aadhaar'); // Mismatch should trigger here too if we add PAN sig
