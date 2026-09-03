import jsPDF from 'jspdf';

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

const LABELS_SERVICE = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  peinture: 'Peinture',
  climatisation: 'Climatisation',
  menuiserie: 'Menuiserie',
  reparation: 'Réparation',
  autre: 'Autre',
};

/**
 * Génère et télécharge un PDF récapitulatif d'une mission terminée.
 *
 * @param {Object} data
 * @param {string} data.titre
 * @param {string} data.description
 * @param {string} data.localisation
 * @param {string} data.typeService
 * @param {number|string} data.budget
 * @param {number|string} data.prixFinal - prix de l'offre acceptée
 * @param {string} data.clientNom
 * @param {string} data.artisanNom
 * @param {string} data.dateCreation
 * @param {string} data.dateDebut
 * @param {string} data.dateFin
 */
export function genererPdfMission(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marge = 20;
  let y = 22;

  // En-tête
  doc.setFillColor(26, 115, 232); // #1a73e8
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(26, 26, 46); // #1a1a2e
  doc.text('FixIt', marge, y);
  doc.setFontSize(11);
  doc.setTextColor(26, 115, 232);
  doc.text('Récapitulatif de mission', marge, y + 7);

  doc.setFontSize(9);
  doc.setTextColor(140, 140, 150);
  doc.text(`Généré le ${formatDate(new Date().toISOString())}`, pageWidth - marge, y, { align: 'right' });

  y += 20;
  doc.setDrawColor(230, 230, 235);
  doc.line(marge, y, pageWidth - marge, y);
  y += 12;

  const section = (titre) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 46);
    doc.text(titre, marge, y);
    y += 8;
  };

  const ligne = (label, valeur) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 110);
    doc.text(label, marge, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 50);
    const texte = doc.splitTextToSize(String(valeur || '—'), pageWidth - marge * 2 - 55);
    doc.text(texte, marge + 55, y);
    y += Math.max(7, texte.length * 5.5);
  };

  section('Mission');
  ligne('Titre', data.titre);
  ligne('Service', LABELS_SERVICE[data.typeService] || data.typeService);
  ligne('Localisation', data.localisation);
  ligne('Description', data.description);
  y += 4;

  section('Parties prenantes');
  ligne('Client', data.clientNom);
  ligne('Artisan', data.artisanNom);
  y += 4;

  section('Budget');
  ligne('Budget initial', data.budget ? `${data.budget} TND` : '—');
  ligne('Prix final convenu', data.prixFinal ? `${data.prixFinal} TND` : '—');
  y += 4;

  section('Dates');
  ligne('Demande publiée', formatDate(data.dateCreation));
  ligne('Mission débutée', formatDate(data.dateDebut));
  ligne('Mission terminée', formatDate(data.dateFin));

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 170);
  doc.text('Document généré automatiquement par FixIt — plateforme de mise en relation avec des artisans.',
    pageWidth / 2, pageHeight - 12, { align: 'center' });

  const nomFichier = `fixit-mission-${(data.titre || 'sans-titre').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.pdf`;
  doc.save(nomFichier);
}