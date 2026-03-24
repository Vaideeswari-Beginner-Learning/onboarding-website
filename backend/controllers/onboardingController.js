import Candidate from '../models/Candidate.js';

/**
 * Handles the automated onboarding flow:
 * 1. Saves/Updates candidate data in MongoDB.
 */
export const handleAutomatedOnboarding = async (req, res) => {
    const { name, email } = req.body;

    try {
        console.log(`🚀 Controller: Automated Onboarding triggered for: ${name} (${email})`);

        // 1. Save/Update in MongoDB
        let candidate = await Candidate.findOne({ email: email.trim().toLowerCase() });

        if (!candidate) {
            candidate = new Candidate({
                id: 'CAND-' + Math.random().toString(36).substr(2, 9),
                name,
                email: email.trim().toLowerCase(),
                role: 'candidate',
                status: 'Submitted',
                date: new Date().toISOString().split('T')[0],
                documents: []
            });
        } else {
            candidate.status = 'Submitted';
            candidate.name = name;
        }

        await candidate.save();
        console.log(`✅ Controller: Candidate saved: ${candidate.email}`);

        res.json({
            success: true,
            message: 'Onboarding data saved successfully.',
            candidate
        });

    } catch (error) {
        console.error('❌ Controller Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};
