import { jsPDF } from 'jspdf';
import { DashboardStats } from '../types';
import { format } from 'date-fns';

export const exportDashboardToPDF = (stats: DashboardStats, range: string): void => {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd HH:mm');

  // Header
  doc.setFillColor(13, 115, 119); // Teal #0D7377
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PawPrint AI - Programme Report', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${dateStr} | Range: ${range.toUpperCase()}`, 20, 30);

  let y = 55;

  const addSectionHeader = (title: string, color: [number, number, number]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1);
    doc.line(20, y - 5, 20, y + 5);

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 25, y + 2);
    y += 15;
  };

  const addStatRow = (label: string, value: number | string) => {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 25, y);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), 120, y, { align: 'right' });

    y += 8;
  };

  // Overall Stats
  addSectionHeader('Overall Metrics', [13, 115, 119]);
  addStatRow('Total Registered Dogs', stats.total_registered || 0);
  addStatRow('Currently In Clinic', stats.currently_in_clinic || 0);
  addStatRow('Released (Period)', stats.released_in_period || 0);
  addStatRow('Critical Cases', stats.needs_attention || 0);

  y += 10;

  // CNVR Programme
  addSectionHeader('CNVR Programme', [13, 115, 119]);
  addStatRow('Total CNVR Registered', stats.cnvr_total || 0);
  addStatRow('Caught (Period)', stats.cnvr_caught_period || 0);
  addStatRow('Sterilized (Period)', stats.cnvr_sterilized_period || 0);
  addStatRow('Released (Period)', stats.cnvr_released_period || 0);

  y += 10;

  // Vaccination Programme
  addSectionHeader('Vaccination Programme', [146, 64, 14]); // Amber #92400E
  addStatRow('Total Vaccinated', stats.vacc_total || 0);
  addStatRow('Vaccinated (Period)', stats.vacc_in_period || 0);
  addStatRow('Rabies Vaccinations', stats.vacc_rabies_period || 0);
  addStatRow('Upcoming Boosters', stats.vacc_boosters_due || 0);

  y += 10;

  // Vaccine Breakdown
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Vaccine Type Breakdown (Period):', 25, y);
  y += 10;
  addStatRow('Rabies', stats.vacc_rabies_period || 0);
  addStatRow('Distemper', stats.vacc_distemper_period || 0);
  addStatRow('Combo', stats.vacc_combo_period || 0);
  addStatRow('Booster', stats.vacc_booster_period || 0);

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `PawPrint AI - NGO Resource Management System`,
      105,
      285,
      { align: 'center' }
    );
  }

  doc.save(`PawPrint_Report_${range}_${format(now, 'yyyyMMdd')}.pdf`);
};
