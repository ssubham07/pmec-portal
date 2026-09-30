/**
 * Generates a certificate number like PMEC/BNF/2026/000123
 */
function generateCertificateNumber(type, sequence) {
  const codes = {
    bonafide_certificate: 'BNF',
    scholarship_verification: 'SCH',
    semester_registration: 'REG',
  };
  const code = codes[type] || 'CRT';
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `PMEC/${code}/${year}/${padded}`;
}

module.exports = { generateCertificateNumber };
