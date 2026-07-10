package com.numberbuddies.phase2.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.numberbuddies.phase2.domain.entity.AiReport;
import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AiReportRepository;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PdfReportGeneratorService {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final AiReportRepository aiReportRepository;

    public PdfReportGeneratorService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            AiReportRepository aiReportRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.aiReportRepository = aiReportRepository;
    }

    private static class FooterPageEvent extends PdfPageEventHelper {
        private final Font footerFont;

        public FooterPageEvent(Font footerFont) {
            this.footerFont = footerFont;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();

            // Footer dividing line
            cb.setColorStroke(new Color(229, 231, 235)); // gray-200
            cb.setLineWidth(0.5f);
            cb.moveTo(document.leftMargin(), 36);
            cb.lineTo(document.getPageSize().getWidth() - document.rightMargin(), 36);
            cb.stroke();

            // Page number (Bottom Right)
            String pageText = "Page " + writer.getPageNumber();
            Phrase pagePhrase = new Phrase(pageText, footerFont);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, pagePhrase,
                    document.getPageSize().getWidth() - document.rightMargin(), 24, 0);

            // Report Branding Label (Bottom Left)
            Phrase brandPhrase = new Phrase("Number Buddies screening assessment", footerFont);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, brandPhrase,
                    document.leftMargin(), 24, 0);

            cb.restoreState();
        }
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream generateReportPdf(UUID assessmentId, String externalUserId) {
        UserProfile user = userProfileRepository.findByExternalUserId(externalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));

        AssessmentRecord assessment = assessmentRecordRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assessment not found"));

        // Verify ownership or parent relation
        boolean isOwner = assessment.getUser().getId().equals(user.getId());
        boolean isParent = user.getId().equals(assessment.getUser().getParent() != null ? assessment.getUser().getParent().getId() : null);

        if (!isOwner && !isParent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to download this report");
        }

        AiReport report = aiReportRepository.findByAssessment_Id(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AI report not found for this assessment"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(36, 36, 54, 54);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            
            // Register page numbering and header helper
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(156, 163, 175));
            writer.setPageEvent(new FooterPageEvent(footerFont));

            document.open();

            // Theme colors
            Color navyColor = new Color(30, 58, 138);       // #1e3a8a
            Color lightBlueColor = new Color(219, 234, 254); // #dbeafe
            Color textGray = new Color(75, 85, 99);         // #4b5563
            Color borderGray = new Color(229, 231, 235);     // #e5e7eb

            // Fonts
            Font whiteTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.WHITE);
            Font whiteSubtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(191, 219, 254));
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, navyColor);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(31, 41, 55));
            Font boldBodyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(31, 41, 55));
            Font disclaimerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, textGray);
            Font headerCellFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, navyColor);

            // 1. Cover Branding Header Band
            PdfPTable headerBand = new PdfPTable(1);
            headerBand.setWidthPercentage(100);
            headerBand.setSpacingAfter(15);

            PdfPCell cell = new PdfPCell();
            cell.setBackgroundColor(navyColor);
            cell.setPadding(16);
            cell.setBorder(PdfPCell.NO_BORDER);

            Paragraph brand = new Paragraph("NUMBER BUDDIES", whiteTitleFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(brand);

            Paragraph desc = new Paragraph("Cognitive Screening & Arithmetic Assessment Report", whiteSubtitleFont);
            desc.setAlignment(Element.ALIGN_CENTER);
            desc.setSpacingBefore(4);
            cell.addElement(desc);

            headerBand.addCell(cell);
            document.add(headerBand);

            // Report Details & ID Grid
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(15);

            infoTable.addCell(createCell("Learner Name: " + assessment.getUser().getName(), boldBodyFont, false));
            infoTable.addCell(createCell("Report ID: " + report.getId().toString(), bodyFont, false));
            infoTable.addCell(createCell("Grade / Age: " + assessment.getUser().getGrade() + " (Age " + assessment.getUser().getAge() + ")", bodyFont, false));
            infoTable.addCell(createCell("Generated Date: " + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), bodyFont, false));
            infoTable.addCell(createCell("Overall Accuracy: " + Math.round(assessment.getTotalScore().doubleValue()) + "% Score", boldBodyFont, false));
            infoTable.addCell(createCell("Assessment Date: " + assessment.getCompletedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), bodyFont, false));
            infoTable.addCell(createCell("AI Screening Risk: " + report.getRiskLevel().name(), getRiskColorFont(report.getRiskLevel().name()), false));
            infoTable.addCell(createCell("Assessment Type: " + assessment.getAssessmentType().name(), bodyFont, false));

            document.add(infoTable);

            // Line separator
            Paragraph separator = new Paragraph("________________________________________________________________________________", FontFactory.getFont(FontFactory.HELVETICA, 8, borderGray));
            separator.setSpacingAfter(12);
            document.add(separator);

            // 2. Executive Summary
            document.add(new Paragraph("1. Executive Summary", sectionTitleFont));
            Paragraph summaryText = new Paragraph(report.getSummary(), bodyFont);
            summaryText.setSpacingBefore(4);
            summaryText.setSpacingAfter(12);
            document.add(summaryText);

            // 3. Cognitive Category Breakdown
            document.add(new Paragraph("2. Cognitive Category breakdown", sectionTitleFont));
            PdfPTable breakdownTable = new PdfPTable(2);
            breakdownTable.setWidthPercentage(100);
            breakdownTable.setSpacingBefore(6);
            breakdownTable.setSpacingAfter(15);

            Font strengthTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(22, 101, 52));
            Font weakTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(153, 27, 27));

            PdfPCell leftHeader = new PdfPCell(new Phrase("STRENGTHS", strengthTitleFont));
            leftHeader.setBackgroundColor(new Color(240, 253, 244));
            leftHeader.setPadding(6);
            leftHeader.setBorderColor(new Color(220, 252, 231));
            breakdownTable.addCell(leftHeader);

            PdfPCell rightHeader = new PdfPCell(new Phrase("AREAS FOR PRACTICE", weakTitleFont));
            rightHeader.setBackgroundColor(new Color(254, 242, 242));
            rightHeader.setPadding(6);
            rightHeader.setBorderColor(new Color(254, 226, 226));
            breakdownTable.addCell(rightHeader);

            StringBuilder strengthsText = new StringBuilder();
            if (report.getStrengths() != null) {
                for (String str : report.getStrengths()) {
                    strengthsText.append("• ").append(formatTopicName(str)).append("\n");
                }
            }
            if (strengthsText.length() == 0) strengthsText.append("• None identified\n");

            StringBuilder weakText = new StringBuilder();
            if (report.getWeakAreas() != null) {
                for (String weak : report.getWeakAreas()) {
                    weakText.append("• ").append(formatTopicName(weak)).append("\n");
                }
            }
            if (weakText.length() == 0) weakText.append("• None identified\n");

            PdfPCell leftCell = new PdfPCell(new Phrase(strengthsText.toString().trim(), bodyFont));
            leftCell.setPadding(6);
            leftCell.setBorderColor(new Color(220, 252, 231));
            breakdownTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell(new Phrase(weakText.toString().trim(), bodyFont));
            rightCell.setPadding(6);
            rightCell.setBorderColor(new Color(254, 226, 226));
            breakdownTable.addCell(rightCell);

            document.add(breakdownTable);

            // 4. Topic-wise Performance Chart (In-PDF Chart)
            document.add(new Paragraph("3. Arithmetic Performance breakdown Chart", sectionTitleFont));
            
            PdfPTable chartTable = new PdfPTable(new float[]{30, 15, 15, 40});
            chartTable.setWidthPercentage(100);
            chartTable.setSpacingBefore(6);
            chartTable.setSpacingAfter(15);

            // Table Headers
            chartTable.addCell(createHeaderCell("Topic", headerCellFont, lightBlueColor));
            chartTable.addCell(createHeaderCell("Questions", headerCellFont, lightBlueColor));
            chartTable.addCell(createHeaderCell("Accuracy", headerCellFont, lightBlueColor));
            chartTable.addCell(createHeaderCell("Visual Accuracy Chart", headerCellFont, lightBlueColor));

            // Group questions by topic
            Map<String, TopicStat> stats = new HashMap<>();
            if (assessment.getQuestionResults() != null) {
                for (QuestionResult q : assessment.getQuestionResults()) {
                    String topicStr = q.getTopic() != null ? q.getTopic().name() : "GENERAL";
                    TopicStat s = stats.computeIfAbsent(topicStr, k -> new TopicStat());
                    s.count++;
                    if (q.isCorrect()) {
                        s.correct++;
                    }
                }
            }

            for (Map.Entry<String, TopicStat> entry : stats.entrySet()) {
                String topicName = formatTopicName(entry.getKey());
                TopicStat s = entry.getValue();
                double accuracy = s.count > 0 ? (s.correct * 100.0) / s.count : 0.0;

                chartTable.addCell(createCell(topicName, bodyFont, true));
                chartTable.addCell(createCell(s.count + " items", bodyFont, true));
                chartTable.addCell(createCell(Math.round(accuracy) + "%", boldBodyFont, true));
                chartTable.addCell(createProgressBarCell(accuracy));
            }

            document.add(chartTable);

            // 5. Action Suggestions
            document.add(new Paragraph("4. Action Suggestions", sectionTitleFont));

            Paragraph parentHeader = new Paragraph("Suggestions for Parents (🏡):", boldBodyFont);
            parentHeader.setSpacingBefore(4);
            document.add(parentHeader);

            StringBuilder pSuggest = new StringBuilder();
            if (report.getParentSuggestions() != null) {
                for (String item : report.getParentSuggestions()) {
                    pSuggest.append("— ").append(item).append("\n");
                }
            }
            Paragraph pSuggestPara = new Paragraph(pSuggest.toString().trim(), bodyFont);
            pSuggestPara.setSpacingAfter(8);
            pSuggestPara.setIndentationLeft(10);
            document.add(pSuggestPara);

            Paragraph teacherHeader = new Paragraph("Suggestions for Teachers (🏫):", boldBodyFont);
            document.add(teacherHeader);

            StringBuilder tSuggest = new StringBuilder();
            if (report.getTeacherSuggestions() != null) {
                for (String item : report.getTeacherSuggestions()) {
                    tSuggest.append("— ").append(item).append("\n");
                }
            }
            Paragraph tSuggestPara = new Paragraph(tSuggest.toString().trim(), bodyFont);
            tSuggestPara.setSpacingAfter(8);
            tSuggestPara.setIndentationLeft(10);
            document.add(tSuggestPara);

            // 6. Recommended Practice Plan
            document.add(new Paragraph("5. Recommended Practice Plan (📅)", sectionTitleFont));
            StringBuilder planSuggest = new StringBuilder();
            if (report.getPracticePlan() != null) {
                for (String item : report.getPracticePlan()) {
                    planSuggest.append("— ").append(item).append("\n");
                }
            }
            Paragraph planPara = new Paragraph(planSuggest.toString().trim(), bodyFont);
            planPara.setSpacingBefore(4);
            planPara.setSpacingAfter(18);
            planPara.setIndentationLeft(10);
            document.add(planPara);

            // 7. Medical Disclaimer Callout Box (Always on final page text block)
            PdfPTable disclaimerTable = new PdfPTable(1);
            disclaimerTable.setWidthPercentage(100);
            
            PdfPCell disclaimerCell = new PdfPCell();
            disclaimerCell.setBackgroundColor(new Color(254, 242, 242)); // light red bg
            disclaimerCell.setBorderColor(new Color(239, 68, 68));     // red border
            disclaimerCell.setPadding(8);
            
            Paragraph discTitle = new Paragraph("IMPORTANT MEDICAL SCREENING DISCLAIMER", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(153, 27, 27)));
            discTitle.setSpacingAfter(3);
            disclaimerCell.addElement(discTitle);
            
            Paragraph discText = new Paragraph("This report is an educational observation and screening tool designed to help teachers and parents recognize cognitive arithmetic pattern differences. This report does NOT constitute a medical diagnosis of dyscalculia or any other learning disability. For a formal evaluation, please consult a qualified child psychologist or medical professional.", disclaimerFont);
            disclaimerCell.addElement(discText);
            
            disclaimerTable.addCell(disclaimerCell);
            document.add(disclaimerTable);

        } catch (DocumentException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF generation failed: " + e.getMessage());
        } finally {
            document.close();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createCell(String content, Font font, boolean border) {
        PdfPCell cell = new PdfPCell(new Paragraph(content, font));
        cell.setPadding(6);
        if (!border) {
            cell.setBorder(PdfPCell.NO_BORDER);
        } else {
            cell.setBorderColor(new Color(229, 231, 235));
        }
        return cell;
    }

    private PdfPCell createHeaderCell(String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.setBorderColor(new Color(229, 231, 235));
        return cell;
    }

    private PdfPCell createProgressBarCell(double accuracy) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(6);
        cell.setBorderColor(new Color(229, 231, 235));

        double barWidth = Math.max(accuracy, 0.01);
        double trackWidth = 100.0 - barWidth;

        PdfPTable progressTable = new PdfPTable(new float[]{(float) barWidth, (float) trackWidth});
        progressTable.setWidthPercentage(100);

        Color barColor;
        if (accuracy >= 80) {
            barColor = new Color(34, 197, 94); // green
        } else if (accuracy >= 50) {
            barColor = new Color(245, 158, 11); // amber
        } else {
            barColor = new Color(239, 68, 68); // red
        }

        PdfPCell barCell = new PdfPCell();
        barCell.setBackgroundColor(barColor);
        barCell.setBorder(PdfPCell.NO_BORDER);
        barCell.setFixedHeight(6);
        progressTable.addCell(barCell);

        PdfPCell trackCell = new PdfPCell();
        trackCell.setBackgroundColor(new Color(243, 244, 246)); // gray-100
        trackCell.setBorder(PdfPCell.NO_BORDER);
        trackCell.setFixedHeight(6);
        progressTable.addCell(trackCell);

        cell.addElement(progressTable);
        return cell;
    }

    private Font getRiskColorFont(String risk) {
        Color color;
        switch (risk.toUpperCase()) {
            case "HIGH": color = new Color(220, 38, 38); break; // red
            case "MODERATE": color = new Color(217, 119, 6); break; // orange
            case "LOW": color = new Color(22, 163, 74); break; // green
            default: color = new Color(31, 41, 55); break;
        }
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, color);
    }

    private String formatTopicName(String topic) {
        if (topic == null || topic.isBlank()) return "";
        String[] words = topic.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
        }
        return sb.toString().trim();
    }

    private static class TopicStat {
        int count = 0;
        int correct = 0;
    }
}
