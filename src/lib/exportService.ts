import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { DashboardStats } from '../types';

interface ExportData {
  stats: DashboardStats;
  range: string;
  boosters: {
    id: string;
    vaccination_date: string | null;
    next_vaccination_due: string | null;
  }[];
}

export const exportService = {
  async generateDashboardPDF(data: ExportData) {
    const { stats, range, boosters } = data;

    if (!stats) throw new Error("Missing statistics for report generation");

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [13, 115, 119]; // #0D7377
    const accentColor = [240, 165, 0];  // #F0A500
    const darkColor = [17, 24, 39];    // #111827
    const grayColor = [107, 114, 128]; // #6B7280
    const lightBg = [249, 250, 251];   // #F9FAFB

    // --- HEADER ---
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // Logo Placeholder
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(25, 22, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('P', 23.5, 23.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text('PawPrint AI', 35, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('INTELLIGENT COMMUNITY DOG MONITORING REPORT', 35, 33);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`REF: ${format(new Date(), 'yyyyMMdd')}-X`, 150, 15);
    doc.text(`DATE: ${format(new Date(), 'PPP')}`, 150, 21);
    doc.text(`RANGE: ${(range || 'all').toUpperCase()}`, 150, 27);

    let y = 65;

    // --- EXECUTIVE SUMMARY ---
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, y);

    y += 10;

    const summaryItems = [
      { label: 'Total Dogs', value: stats.total_registered || 0, color: primaryColor },
      { label: 'Active Care', value: stats.currently_in_clinic || 0, color: [245, 158, 11] },
      { label: 'Successful', value: stats.released_in_period || 0, color: [16, 185, 129] },
      { label: 'Critical', value: stats.needs_attention || 0, color: [239, 68, 68] }
    ];

    summaryItems.forEach((item, i) => {
      const x = 20 + (i * 45);
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, 40, 30, 2, 2, 'FD');

      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(x + 5, y + 2, 10, 0.5, 'F');

      doc.setFontSize(7);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label.toUpperCase(), x + 5, y + 10);

      doc.setFontSize(18);
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text((item.value || 0).toString(), x + 5, y + 22);
    });

    y += 45;

    // --- PROGRAMME BREAKDOWN ---
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Programme Performance', 20, y);

    y += 10;

    // CNVR Block
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(20, y, 170, 50, 2, 2, 'F');

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.line(25, y + 5, 25, y + 15);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(11);
    doc.text('CNVR: CATCH-NEUTER-VACCINATE-RELEASE', 30, y + 11);

    const cnStats = [
      { l: 'Registered', v: stats.cnvr_total || 0 },
      { l: 'Caught', v: stats.cnvr_caught_period || 0 },
      { l: 'Sterilized', v: stats.cnvr_sterilized_period || 0 },
      { l: 'Released', v: stats.cnvr_released_period || 0 }
    ];

    cnStats.forEach((s, i) => {
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(12);
      doc.text((s.v || 0).toString(), 30 + (i * 40), y + 28);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFontSize(7);
      doc.text(s.l, 30 + (i * 40), y + 34);
    });

    // Pipeline Bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(30, y + 42, 150, 1.5, 0.5, 0.5, 'F');
    const caughtVal = stats.cnvr_caught_period || 1;
    const pWidth = Math.min(150, ((stats.cnvr_released_period || 0) / caughtVal) * 150);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(30, y + 42, pWidth, 1.5, 0.5, 0.5, 'F');

    y += 60;

    // VACCINATION Block
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(20, y, 170, 50, 2, 2, 'F');

    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.line(25, y + 5, 25, y + 15);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('FIELD VACCINATION AND BOOSTER CAMPS', 30, y + 11);

    const vStats = [
      { l: 'Covered', v: stats.vacc_total || 0 },
      { l: 'Rabies', v: stats.vacc_rabies_period || 0 },
      { l: 'Boosters', v: stats.vacc_booster_period || 0 },
      { l: 'Due', v: stats.vacc_boosters_due || 0 }
    ];

    vStats.forEach((s, i) => {
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(12);
      doc.text((s.v || 0).toString(), 30 + (i * 40), y + 28);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFontSize(7);
      doc.text(s.l, 30 + (i * 40), y + 34);
    });

    // Vaccine Breakdown Bars (4 bars)
    const maxV = Math.max(
      stats.vacc_rabies_period || 0,
      stats.vacc_distemper_period || 0,
      stats.vacc_combo_period || 0,
      stats.vacc_booster_period || 0,
      1
    );
    const vColorsList = [[240, 165, 0], [59, 130, 246], [139, 92, 246], [16, 185, 129]];
    const bStatsList = [
      { l: 'Rabies', v: stats.vacc_rabies_period || 0 },
      { l: 'Distemper', v: stats.vacc_distemper_period || 0 },
      { l: 'Combo', v: stats.vacc_combo_period || 0 },
      { l: 'Booster', v: stats.vacc_booster_period || 0 }
    ];

    bStatsList.forEach((s, i) => {
      const bW = (s.v / maxV) * 35;
      doc.setFillColor(vColorsList[i][0], vColorsList[i][1], vColorsList[i][2]);
      doc.rect(30 + (i * 40), y + 42, bW, 2, 'F');
      doc.setFontSize(5);
      doc.text(s.l, 30 + (i * 40), y + 46);
    });

    y += 65;

    // --- BOOSTER TABLE ---
    if (boosters && boosters.length > 0) {
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(13);
      doc.text('Priority Booster Schedule', 20, y);

      y += 8;
      doc.setFillColor(243, 244, 246);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFontSize(7);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('DOG REFERENCE', 25, y + 5);
      doc.text('LAST VACCINATION', 70, y + 5);
      doc.text('NEXT DUE', 120, y + 5);
      doc.text('URGENCY', 165, y + 5);

      y += 8;
      boosters.slice(0, 8).forEach((dog) => {
        const dueAt = dog.next_vaccination_due ? new Date(dog.next_vaccination_due) : null;
        const isOverdue = dueAt && dueAt < new Date();

        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(8);
        doc.text((dog.id || '???').split('-')[0].toUpperCase(), 25, y + 6);
        doc.text(dog.vaccination_date ? format(new Date(dog.vaccination_date), 'MMM d, yyyy') : '-', 70, y + 6);

        if (isOverdue) doc.setTextColor(220, 38, 38);
        doc.text(dog.next_vaccination_due ? format(new Date(dog.next_vaccination_due), 'MMM d, yyyy') : '-', 120, y + 6);

        doc.setTextColor(isOverdue ? 220 : 107, isOverdue ? 38 : 114, isOverdue ? 38 : 128);
        doc.text(isOverdue ? 'CRITICAL' : 'PLANNED', 165, y + 6);

        doc.setDrawColor(243, 244, 246);
        doc.line(20, y + 10, 190, y + 10);
        y += 10;
      });
    }

    // --- FOOTER ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageCount = (doc as any).internal.getNumberOfPages() || 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 282, 190, 282);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('PAWPRINT AI OPERATIONS MONITORING - CONFIDENTIAL RECORD', 105, 288, { align: 'center' });
      doc.text(`PAGE ${i} / ${pageCount}`, 190, 288, { align: 'right' });
    }

    doc.save(`PawPrint_Executive_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
};
