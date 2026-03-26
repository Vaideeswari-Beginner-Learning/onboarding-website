import { analyzeDocument } from './documentAnalyzer.js';

async function runTests() {
    console.log("🚀 Starting v6.0 Smart Photo Logic Verification...\n");

    const testCases = [
        { name: "valid_passport.jpg", docId: "photo", expected: "valid" },
        { name: "group_photo.png", docId: "photo", expected: "rejected" },
        { name: "scenery_mountain.jpg", docId: "photo", expected: "rejected" },
        { name: "meme_funny.png", docId: "photo", expected: "rejected" },
        { name: "tilt_head_photo.jpg", docId: "photo", expected: "valid", note: "Should be valid but show Tilted/Off-center" },
        { name: "outdoor_complex_bg.jpg", docId: "photo", expected: "rejected" }
    ];

    for (const test of testCases) {
        console.log(`Testing: ${test.name}...`);
        const file = { name: test.name, type: 'image/jpeg' };
        const result = await analyzeDocument(file, test.docId);
        
        const passed = result.status === test.expected;
        const statusIcon = passed ? "✅" : "❌";
        
        console.log(`${statusIcon} Result: ${result.status.toUpperCase()}`);
        if (result.extractedData) {
            console.log(`   - Face detected: ${result.extractedData.faceDetected}`);
            console.log(`   - Face count: ${result.extractedData.faceCount || 0}`);
            console.log(`   - Background: ${result.extractedData.background || 'N/A'}`);
            console.log(`   - Orientation: ${result.extractedData.orientation || 'N/A'}`);
        }
        if (result.details) console.log(`   - Details: ${result.details}`);
        console.log("-----------------------------------\n");
    }
}

runTests().catch(console.error);
