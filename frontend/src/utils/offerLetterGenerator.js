import { jsPDF } from "jspdf";

export const generateOfferLetter = async (candidate) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // Main content margin
    const sidebarWidth = 0; // Removing sidebar for standard letter, using top header style instead for "Professional" look which is usually clean. 
    // Actually, user asked for "Attractive". A sidebar is distinctive. Let's do a top colored header bar.

    const offer = candidate.offerDetails || {};
    const companyName = offer.companyName || "FORGE INDIA CONNECT PVT.LTD"; // Updated default based on Logo
    const companyAddress = offer.companyAddress || "Rk Tower, Royakottai, krishnagiri"; // Updated default
    const adminName = offer.adminName || "HR Manager";
    const employeeName = offer.employeeName || candidate.name;

    // --- Helper: Parse CTC & Calculate Components (Moved to top) ---
    const parseCTC = (ctcStr) => {
        if (!ctcStr) return 0;
        let val = parseFloat(ctcStr.toString().replace(/[^0-9.]/g, ''));
        // If "LPA" is present OR value is small (e.g. 3, 4.5), assume Lakhs
        if (ctcStr.toString().toLowerCase().includes('lpa') || val < 100) {
            val = val * 100000;
        }
        return val || 0;
    };

    const annualCTC = parseCTC(offer.ctc);
    const monthlyCTC = annualCTC / 12;

    // Salary Structure
    const basicYearly = annualCTC * 0.50;
    const basicMonthly = basicYearly / 12;

    const hraYearly = basicYearly * 0.40;
    const hraMonthly = hraYearly / 12;

    // Deductions
    const pfMonthly = Math.min(basicMonthly * 0.12, 1800);
    const pfYearly = pfMonthly * 12;

    const ptMonthly = 200;
    const ptYearly = 2400;

    // Special: Balancing figure
    const specialYearly = annualCTC - basicYearly - hraYearly;
    const specialMonthly = specialYearly / 12;

    const totalDeductionsMonthly = pfMonthly + ptMonthly;
    const totalDeductionsYearly = pfYearly + ptYearly;

    const netMonthly = monthlyCTC - totalDeductionsMonthly;
    const netYearly = annualCTC - totalDeductionsYearly;


    // --- Helper to load image ---
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
        });
    };

    let logoImg = null;
    try {
        logoImg = await loadImage('/logo.jpg');
    } catch (e) { console.error("Logo load error", e); }

    // --- Design Constants ---
    const primaryColor = [0, 51, 153]; // Deep Blue
    const accentColor = [255, 165, 0]; // Orange/Gold from logo
    const lightGrey = [240, 240, 240];

    // --- Helper: Draw Page Background/Header ---
    const drawPageLayout = (isFirstPage) => {
        // Watermark
        if (logoImg) {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.05 }));
            const wmW = 120;
            const wmH = (logoImg.height / logoImg.width) * wmW;
            doc.addImage(logoImg, 'JPEG', (pageWidth - wmW) / 2, (pageHeight - wmH) / 2, wmW, wmH);
            doc.restoreGraphicsState();
        }

        // Footer Line
        // Footer Line
        doc.setDrawColor(200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.setFont("helvetica", "italic");
        doc.text("Forge India Connect - Simplifying Connection and Amplifying Success", pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    // ================= PAGE 1 =================
    drawPageLayout(true);

    // --- Professional Header ---
    // Top Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Logo Placement (Top Right)
    let logoBottomY = 20; // Default if no logo
    if (logoImg) {
        const logoW = 45;
        const logoH = (logoImg.height / logoImg.width) * logoW;
        doc.addImage(logoImg, 'JPEG', pageWidth - margin - logoW, 15, logoW, logoH);
        logoBottomY = 15 + logoH;
    }

    // Company Info (Top Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    // Split Company Name if too long
    const companyNameLines = doc.splitTextToSize(companyName.toUpperCase(), 120);
    doc.text(companyNameLines, margin, 25);

    let currentY = 25 + (companyNameLines.length * 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const addrLines = doc.splitTextToSize(companyAddress, 100);
    doc.text(addrLines, margin, currentY);

    // Separator
    currentY += (addrLines.length * 5) + 5;

    // Ensure line is below logo to prevent damage/overlap
    if (currentY < logoBottomY + 5) {
        currentY = logoBottomY + 5;
    }

    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // --- Date & Recipient ---
    currentY += 10;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`Date: ${today}`, margin, currentY);

    currentY += 10;

    // To Block
    doc.setFont("helvetica", "bold");
    doc.text("To,", margin, currentY);
    currentY += 5;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(employeeName.toUpperCase(), margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(candidate.email, margin, currentY);

    // --- Subject ---
    currentY += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("OFFER LETTER", pageWidth / 2, currentY, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line((pageWidth / 2) - 30, currentY + 2, (pageWidth / 2) + 30, currentY + 2); // Underline title

    currentY += 15;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Ref: Employment as ${offer.jobRole || 'Employee'}`, margin, currentY);

    // --- Body ---
    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);

    const salutation = `Dear ${employeeName.split(' ')[0]},`;
    doc.text(salutation, margin, currentY);
    currentY += 8;

    const intro = `We are delighted to offer you the position of "${offer.jobRole || 'Employee'}" at ${companyName}. After reviewing your profile and credentials, we believe your skills will be a significant asset to our organization.`;
    const introLines = doc.splitTextToSize(intro, pageWidth - (margin * 2));
    doc.text(introLines, margin, currentY);
    currentY += (introLines.length * 6) + 5;

    // --- Offer Grid (Attractive Box) ---
    const gridY = currentY;
    doc.setFillColor(248, 250, 252); // Very light blue bg
    doc.setDrawColor(220);
    doc.roundedRect(margin, gridY, pageWidth - (margin * 2), 45, 3, 3, 'FD');

    let boxY = gridY + 10;
    const drawRow = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 10, boxY);
        doc.setFont("helvetica", "normal");
        doc.text(`:   ${value}`, margin + 60, boxY);
        boxY += 8;
    };

    drawRow("Role / Designation", offer.jobRole || 'Employee');
    const ctcLPA = (annualCTC / 100000).toFixed(2) + " LPA";
    drawRow("Annual CTC", ctcLPA);
    drawRow("Date of Joining", offer.joiningDate || 'Immediate');
    drawRow("Work Location", offer.location || 'Bangalore');

    currentY = gridY + 60;

    // --- Roles & Responsibilities (New Section) ---
    if (offer.responsibilities && offer.responsibilities.trim().length > 0) {
        // Check space before adding header
        if (currentY > pageHeight - 100) {
            doc.addPage();
            drawPageLayout(false);
            currentY = 40;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text("Roles & Responsibilities:", margin, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30);

        const respLines = doc.splitTextToSize(offer.responsibilities, pageWidth - (margin * 2));
        doc.text(respLines, margin, currentY);
        currentY += (respLines.length * 5) + 10;
    }

    // --- Closing Paragraph ---
    // Ensure space for closing paragraph (Adjusted threshold to 40)
    if (currentY > pageHeight - 40) {
        doc.addPage();
        drawPageLayout(false);
        currentY = 40;
    }

    const closing = "This offer is valid for 3 days. Please sign and return the duplicate copy of this letter as a token of your acceptance. The detailed terms and conditions of your employment are annexed to this letter.";
    const closingLines = doc.splitTextToSize(closing, pageWidth - (margin * 2));
    doc.text(closingLines, margin, currentY);
    // --- Footer Note ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    // Draw footer at bottom of current page now, or just leave standard footer
    // doc.text("(Detailed Compensation & Terms continued in Annexures)", margin, pageHeight - 25); 


    // ================= ANNEXURE A: COMPENSATION DETAILS =================

    // Check if enough space for Header + at least 4 rows (~60 units)
    // If not, explicitly add page.
    if (currentY > pageHeight - 60) {
        doc.addPage();
        drawPageLayout(false);
        currentY = 30; // Standard top margin
    } else {
        currentY += 15; // Gap before table
        // Draw separate line if on same page
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
    }

    let yPos = currentY;

    // --- Helper: Parse CTC & Calculate Components ---
    // (Calculations moved to top of file)

    // Format Currency Helper
    const formatCurrency = (amount) => {
        return Math.round(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', 'Rs. ');
    };

    const drawTableHeader = (y) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text("ANNEXURE A : COMPENSATION DETAILS", margin, y);
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(1);
        doc.line(margin, y + 3, pageWidth - margin, y + 3);

        y += 15;

        doc.setFillColor(240, 240, 240);
        doc.rect(col1X, y, (pageWidth - (margin * 2)), rowHeight, 'F');
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text("Salary Component", col1X + 5, y + 7);
        doc.text("Monthly (INR)", col2X + 5, y + 7);
        doc.text("Annual (INR)", col3X + 5, y + 7);

        return y + rowHeight;
    };

    // Table Columns
    const col1X = margin;
    const col2X = margin + 80;
    const col3X = margin + 130;
    const rowHeight = 10;

    // Draw Initial Header
    yPos = drawTableHeader(yPos);

    // Row Helper with Page Break support
    const drawTableRow = (label, monthly, annual, isBold = false) => {
        // Check for page break
        if (yPos > pageHeight - 30) {
            doc.addPage();
            drawPageLayout(false);
            yPos = 30;
            yPos = drawTableHeader(yPos); // Redraw header on new page
        }

        if (isBold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");

        doc.setDrawColor(220);
        doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight); // Cell border

        // Vertical dividers
        doc.line(col2X, yPos, col2X, yPos + rowHeight);
        doc.line(col3X, yPos, col3X, yPos + rowHeight);

        doc.text(label, col1X + 5, yPos + 7);
        doc.text(formatCurrency(monthly), col2X + 5, yPos + 7);
        doc.text(formatCurrency(annual), col3X + 5, yPos + 7);

        yPos += rowHeight;
    };

    // Earnings
    drawTableRow("Basic Salary", basicMonthly, basicYearly);
    drawTableRow("House Rent Allowance (HRA)", hraMonthly, hraYearly);
    drawTableRow("Special Allowance", specialMonthly, specialYearly);
    drawTableRow("Gross Salary", monthlyCTC, annualCTC, true);

    // Deductions Header check
    if (yPos > pageHeight - 30) {
        doc.addPage();
        drawPageLayout(false);
        yPos = 30; // Just start new section
    }

    doc.setFillColor(250, 250, 250);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Deductions", col1X + 5, yPos + 7);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight); // Border
    yPos += rowHeight;

    doc.setFont("helvetica", "normal");
    drawTableRow("Provident Fund (PF)", pfMonthly, pfYearly);
    drawTableRow("Professional Tax (PT)", ptMonthly, ptYearly);
    drawTableRow("Total Deductions", totalDeductionsMonthly, totalDeductionsYearly, true);

    yPos += 2;

    // Net Salary Logic
    if (yPos > pageHeight - 30) {
        doc.addPage();
        drawPageLayout(false);
        yPos = 30;
    }

    // Net Salary Row (Highlighted)
    doc.setFillColor(...primaryColor);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight + 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Net Take Home Salary", col1X + 5, yPos + 8);
    doc.text(formatCurrency(netMonthly), col2X + 5, yPos + 8);
    doc.text(formatCurrency(netYearly), col3X + 5, yPos + 8);
    yPos += 25;

    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("* Note: Income Tax deductions will be applicable based on the tax regime selected.", margin, yPos);


    // ================= ANNEXURE B: TERMS =================
    // Always start Annexure B on a new page for professional layout
    doc.addPage();
    drawPageLayout(false);
    yPos = 30;

    // Annexure Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text("ANNEXURE B : TERMS OF EMPLOYMENT", margin, yPos);
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(1);
    doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20);

    const terms = [
        { t: "1. Probation Period", d: "You will be on probation for a period of 6 months. Confirmation is subject to satisfactory performance." },
        { t: "2. Notice Period", d: "15 Days during probation. 2 Months (60 Days) after confirmation." },
        { t: "3. Working Hours", d: "9:30 AM to 6:30 PM, Monday to Saturday." },
        { t: "4. Code of Conduct", d: "You must adhere to the company's policies on professional ethics, discipline, and integrity." },
        { t: "5. Compensation", d: "Salary is subject to statutory deductions (PF, PT, TDS) as applicable." },
        { t: "6. Confidentiality", d: "You shall maintain strict confidentiality regarding company data and client information." },
        { t: "7. Termination", d: "The company reserves the right to terminate employment for misconduct or non-performance as per policy." }
    ];

    terms.forEach(term => {
        if (yPos > pageHeight - 40) { // Check space
            doc.addPage();
            drawPageLayout(false);
            yPos = 30;
        }

        doc.setFont("helvetica", "bold");
        doc.text(term.t, margin, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        const dLines = doc.splitTextToSize(term.d, pageWidth - (margin * 2));
        doc.text(dLines, margin, yPos);
        yPos += (dLines.length * 5) + 6;
    });

    // --- Signatures (Bottom of Last Page) ---

    // Ensure separate section at bottom
    yPos = Math.max(yPos + 10, pageHeight - 60);
    if (yPos > pageHeight - 50) {
        doc.addPage();
        drawPageLayout(false);
        yPos = pageHeight - 60;
    }

    // Signature Box
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Admin
    doc.setFont("helvetica", "bold");
    doc.text(`FORGE INDIA CONNECT PVT.LTD`, margin, yPos);
    doc.text("Sandeep.V", margin, yPos + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Authorized Signatory", margin, yPos + 16);

    // Candidate
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Accepted By:", pageWidth - margin - 50, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(employeeName, pageWidth - margin - 50, yPos + 10);
    doc.text(`Date: ${today}`, pageWidth - margin - 50, yPos + 15);

    doc.save(`Offer_Letter_${employeeName.replace(/\s+/g, '_')}.pdf`);
};

// Returns a base64 string of the PDF (for email attachment)
export const generateOfferLetterBase64 = async (candidate) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const offer = candidate.offerDetails || {};
    const companyName = offer.companyName || "FORGE INDIA CONNECT PVT.LTD";
    const companyAddress = offer.companyAddress || "Rk Tower, Royakottai, krishnagiri";
    const adminName = offer.adminName || "HR Manager";
    const employeeName = offer.employeeName || candidate.name;

    const parseCTC = (ctcStr) => {
        if (!ctcStr) return 0;
        let val = parseFloat(ctcStr.toString().replace(/[^0-9.]/g, ''));
        if (ctcStr.toString().toLowerCase().includes('lpa') || val < 100) {
            val = val * 100000;
        }
        return val || 0;
    };

    const annualCTC = parseCTC(offer.ctc);
    const monthlyCTC = annualCTC / 12;
    const basicYearly = annualCTC * 0.50;
    const basicMonthly = basicYearly / 12;
    const hraYearly = basicYearly * 0.40;
    const hraMonthly = hraYearly / 12;
    const pfMonthly = Math.min(basicMonthly * 0.12, 1800);
    const pfYearly = pfMonthly * 12;
    const ptMonthly = 200;
    const ptYearly = 2400;
    const specialYearly = annualCTC - basicYearly - hraYearly;
    const specialMonthly = specialYearly / 12;
    const totalDeductionsMonthly = pfMonthly + ptMonthly;
    const totalDeductionsYearly = pfYearly + ptYearly;
    const netMonthly = monthlyCTC - totalDeductionsMonthly;
    const netYearly = annualCTC - totalDeductionsYearly;

    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
        });
    };

    let logoImg = null;
    try { logoImg = await loadImage('/logo.jpg'); } catch (e) { /* silent */ }

    const primaryColor = [0, 51, 153];
    const accentColor = [255, 165, 0];

    const drawPageLayout = (isFirstPage) => {
        if (logoImg) {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.05 }));
            const wmW = 120;
            const wmH = (logoImg.height / logoImg.width) * wmW;
            doc.addImage(logoImg, 'JPEG', (pageWidth - wmW) / 2, (pageHeight - wmH) / 2, wmW, wmH);
            doc.restoreGraphicsState();
        }
        doc.setDrawColor(200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.setFont("helvetica", "italic");
        doc.text("Forge India Connect - Simplifying Connection and Amplifying Success", pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    drawPageLayout(true);
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 4, 'F');

    let logoBottomY = 20;
    if (logoImg) {
        const logoW = 45;
        const logoH = (logoImg.height / logoImg.width) * logoW;
        doc.addImage(logoImg, 'JPEG', pageWidth - margin - logoW, 15, logoW, logoH);
        logoBottomY = 15 + logoH;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    const companyNameLines = doc.splitTextToSize(companyName.toUpperCase(), 120);
    doc.text(companyNameLines, margin, 25);
    let currentY = 25 + (companyNameLines.length * 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const addrLines = doc.splitTextToSize(companyAddress, 100);
    doc.text(addrLines, margin, currentY);
    currentY += (addrLines.length * 5) + 5;
    if (currentY < logoBottomY + 5) currentY = logoBottomY + 5;
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 10;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`Date: ${today}`, margin, currentY);
    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("To,", margin, currentY);
    currentY += 5;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(employeeName.toUpperCase(), margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(candidate.email, margin, currentY);

    currentY += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("OFFER LETTER", pageWidth / 2, currentY, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line((pageWidth / 2) - 30, currentY + 2, (pageWidth / 2) + 30, currentY + 2);

    currentY += 15;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Ref: Employment as ${offer.jobRole || 'Employee'}`, margin, currentY);

    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const salutation = `Dear ${employeeName.split(' ')[0]},`;
    doc.text(salutation, margin, currentY);
    currentY += 8;

    const intro = `We are delighted to offer you the position of "${offer.jobRole || 'Employee'}" at ${companyName}. After reviewing your profile and credentials, we believe your skills will be a significant asset to our organization.`;
    const introLines = doc.splitTextToSize(intro, pageWidth - (margin * 2));
    doc.text(introLines, margin, currentY);
    currentY += (introLines.length * 6) + 5;

    const gridY = currentY;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(220);
    doc.roundedRect(margin, gridY, pageWidth - (margin * 2), 45, 3, 3, 'FD');
    let boxY = gridY + 10;
    const drawRow = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 10, boxY);
        doc.setFont("helvetica", "normal");
        doc.text(`:   ${value}`, margin + 60, boxY);
        boxY += 8;
    };
    drawRow("Role / Designation", offer.jobRole || 'Employee');
    const ctcLPA = (annualCTC / 100000).toFixed(2) + " LPA";
    drawRow("Annual CTC", ctcLPA);
    drawRow("Date of Joining", offer.joiningDate || 'Immediate');
    drawRow("Work Location", offer.location || 'Bangalore');
    currentY = gridY + 60;

    if (offer.responsibilities && offer.responsibilities.trim().length > 0) {
        if (currentY > pageHeight - 100) { doc.addPage(); drawPageLayout(false); currentY = 40; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text("Roles & Responsibilities:", margin, currentY);
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30);
        const respLines = doc.splitTextToSize(offer.responsibilities, pageWidth - (margin * 2));
        doc.text(respLines, margin, currentY);
        currentY += (respLines.length * 5) + 10;
    }

    if (currentY > pageHeight - 40) { doc.addPage(); drawPageLayout(false); currentY = 40; }
    const closing = "This offer is valid for 3 days. Please sign and return the duplicate copy of this letter as a token of your acceptance. The detailed terms and conditions of your employment are annexed to this letter.";
    const closingLines = doc.splitTextToSize(closing, pageWidth - (margin * 2));
    doc.text(closingLines, margin, currentY);

    // ANNEXURE A
    if (currentY > pageHeight - 60) { doc.addPage(); drawPageLayout(false); currentY = 30; }
    else { currentY += 15; doc.setDrawColor(200); doc.setLineWidth(0.5); doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5); }

    let yPos = currentY;
    const formatCurrency = (amount) => Math.round(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', 'Rs. ');
    const col1X = margin;
    const col2X = margin + 80;
    const col3X = margin + 130;
    const rowHeight = 10;

    const drawTableHeader = (y) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...primaryColor);
        doc.text("ANNEXURE A : COMPENSATION DETAILS", margin, y);
        doc.setDrawColor(...accentColor); doc.setLineWidth(1); doc.line(margin, y + 3, pageWidth - margin, y + 3);
        y += 15;
        doc.setFillColor(240, 240, 240);
        doc.rect(col1X, y, (pageWidth - (margin * 2)), rowHeight, 'F');
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text("Salary Component", col1X + 5, y + 7);
        doc.text("Monthly (INR)", col2X + 5, y + 7);
        doc.text("Annual (INR)", col3X + 5, y + 7);
        return y + rowHeight;
    };

    yPos = drawTableHeader(yPos);

    const drawTableRow = (label, monthly, annual, isBold = false) => {
        if (yPos > pageHeight - 30) { doc.addPage(); drawPageLayout(false); yPos = 30; yPos = drawTableHeader(yPos); }
        if (isBold) doc.setFont("helvetica", "bold"); else doc.setFont("helvetica", "normal");
        doc.setDrawColor(220);
        doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight);
        doc.line(col2X, yPos, col2X, yPos + rowHeight);
        doc.line(col3X, yPos, col3X, yPos + rowHeight);
        doc.text(label, col1X + 5, yPos + 7);
        doc.text(formatCurrency(monthly), col2X + 5, yPos + 7);
        doc.text(formatCurrency(annual), col3X + 5, yPos + 7);
        yPos += rowHeight;
    };

    drawTableRow("Basic Salary", basicMonthly, basicYearly);
    drawTableRow("House Rent Allowance (HRA)", hraMonthly, hraYearly);
    drawTableRow("Special Allowance", specialMonthly, specialYearly);
    drawTableRow("Gross Salary", monthlyCTC, annualCTC, true);

    if (yPos > pageHeight - 30) { doc.addPage(); drawPageLayout(false); yPos = 30; }
    doc.setFillColor(250, 250, 250);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Deductions", col1X + 5, yPos + 7);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight);
    yPos += rowHeight;
    doc.setFont("helvetica", "normal");
    drawTableRow("Provident Fund (PF)", pfMonthly, pfYearly);
    drawTableRow("Professional Tax (PT)", ptMonthly, ptYearly);
    drawTableRow("Total Deductions", totalDeductionsMonthly, totalDeductionsYearly, true);
    yPos += 2;

    if (yPos > pageHeight - 30) { doc.addPage(); drawPageLayout(false); yPos = 30; }
    doc.setFillColor(...primaryColor);
    doc.rect(col1X, yPos, (pageWidth - (margin * 2)), rowHeight + 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text("Net Take Home Salary", col1X + 5, yPos + 8);
    doc.text(formatCurrency(netMonthly), col2X + 5, yPos + 8);
    doc.text(formatCurrency(netYearly), col3X + 5, yPos + 8);
    yPos += 25;
    doc.setTextColor(100); doc.setFontSize(8); doc.setFont("helvetica", "italic");
    doc.text("* Note: Income Tax deductions will be applicable based on the tax regime selected.", margin, yPos);

    // ANNEXURE B
    doc.addPage();
    drawPageLayout(false);
    yPos = 30;
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...primaryColor);
    doc.text("ANNEXURE B : TERMS OF EMPLOYMENT", margin, yPos);
    doc.setDrawColor(...accentColor); doc.setLineWidth(1); doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
    yPos += 15;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(20);

    const terms = [
        { t: "1. Probation Period", d: "You will be on probation for a period of 6 months. Confirmation is subject to satisfactory performance." },
        { t: "2. Notice Period", d: "15 Days during probation. 2 Months (60 Days) after confirmation." },
        { t: "3. Working Hours", d: "9:30 AM to 6:30 PM, Monday to Saturday." },
        { t: "4. Code of Conduct", d: "You must adhere to the company's policies on professional ethics, discipline, and integrity." },
        { t: "5. Compensation", d: "Salary is subject to statutory deductions (PF, PT, TDS) as applicable." },
        { t: "6. Confidentiality", d: "You shall maintain strict confidentiality regarding company data and client information." },
        { t: "7. Termination", d: "The company reserves the right to terminate employment for misconduct or non-performance as per policy." }
    ];

    terms.forEach(term => {
        if (yPos > pageHeight - 40) { doc.addPage(); drawPageLayout(false); yPos = 30; }
        doc.setFont("helvetica", "bold");
        doc.text(term.t, margin, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        const dLines = doc.splitTextToSize(term.d, pageWidth - (margin * 2));
        doc.text(dLines, margin, yPos);
        yPos += (dLines.length * 5) + 6;
    });

    yPos = Math.max(yPos + 10, pageHeight - 60);
    if (yPos > pageHeight - 50) { doc.addPage(); drawPageLayout(false); yPos = pageHeight - 60; }
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`FORGE INDIA CONNECT PVT.LTD`, margin, yPos);
    doc.text("Sandeep.V", margin, yPos + 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("Authorized Signatory", margin, yPos + 16);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Accepted By:", pageWidth - margin - 50, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(employeeName, pageWidth - margin - 50, yPos + 10);
    doc.text(`Date: ${today}`, pageWidth - margin - 50, yPos + 15);

    // Return base64 instead of saving
    const pdfOutput = doc.output('datauristring');
    // Extract base64 portion (remove "data:application/pdf;filename=generated.pdf;base64," prefix)
    const base64 = pdfOutput.split(',')[1];
    return base64;
};
