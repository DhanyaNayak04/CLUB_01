import React, { useRef } from 'react';

const Certificate = ({ student, event, onClose }) => {
  const certificateRef = useRef(null);

  const generatePDF = () => {
    if (!certificateRef.current || !window.html2canvas || !window.jspdf) {
      alert('PDF generation libraries not loaded. Please refresh and try again.');
      return;
    }
    
    try {
      const { jsPDF } = window.jspdf;
      
      window.html2canvas(certificateRef.current, {
        scale: 2, // Better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#fff'
      }).then(canvas => {
        try {
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF('landscape', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${student.name}_${event.title}_certificate.pdf`);
        } catch (err) {
          console.error('Error generating PDF:', err);
          alert('Failed to generate PDF. Please try again.');
        }
      }).catch(err => {
        console.error('Error with html2canvas:', err);
        alert('Failed to render certificate. Please try again.');
      });
    } catch (err) {
      console.error('Error accessing PDF libraries:', err);
      alert('PDF generation failed. Please ensure you have a stable internet connection.');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate a certificate ID if one doesn't exist
  const certificateId = student.certificateId || student._id || 
    `CERT-${event._id?.substring(0, 6)}-${student._id?.substring(0, 6)}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,35,126,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(135deg, #fff 60%, #ffd70022 100%)', padding: '20px', borderRadius: '18px', maxWidth: '90%', maxHeight: '90%', overflow: 'auto', position: 'relative', boxShadow: '0 8px 32px 0 #1a237e33' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          &times;
        </button>
        
        <div 
          ref={certificateRef} 
          style={{ 
            width: '800px', 
            height: '550px', 
            border: '12px solid #ffd700', 
            padding: '20px',
            boxSizing: 'border-box',
            textAlign: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, #fff 70%, #ffd70022 100%)',
            margin: '20px auto',
            boxShadow: '0 8px 32px 0 #ffd70033'
          }}
        >
          {/* Certificate Header */}
          <div style={{ borderBottom: '2px solid #0d47a1', paddingBottom: '10px', marginBottom: '20px' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#0d47a1', margin: '10px 0' }}>Certificate of Participation</h1>
          </div>
          
          {/* Certificate Body */}
          <div style={{ margin: '40px 0' }}>
            <p style={{ fontSize: '18px', fontFamily: 'Montserrat, sans-serif', marginBottom: '30px' }}>
              This certificate is awarded to
            </p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#0d47a1', margin: '10px 0' }}>
              {student.name}
            </h2>
            <p style={{ fontSize: '18px', fontFamily: 'Montserrat, sans-serif', margin: '30px 0' }}>
              for participating in the
            </p>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '24px', margin: '10px 0' }}>
              {event.title}
            </h3>
            <p style={{ fontSize: '18px', fontFamily: 'Montserrat, sans-serif', margin: '10px 0' }}>
              organized by {event.clubName || 'College Club'} on {new Date(event.date).toLocaleDateString()}
            </p>
          </div>
          
          {/* Certificate Footer */}
          <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ borderTop: '2px solid #000', paddingTop: '10px', width: '200px', margin: '0 auto' }}>
                  Event Coordinator
                </div>
              </div>
              <div>
                <div style={{ borderTop: '2px solid #000', paddingTop: '10px', width: '200px', margin: '0 auto' }}>
                  College Principal
                </div>
              </div>
            </div>
            <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
              Issued on {currentDate} • Certificate ID: {certificateId}
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={generatePDF} 
            style={{ 
              padding: '12px 28px', 
              background: 'linear-gradient(90deg, #512da8 0%, #ffd700 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px 0 #ffd70033'
            }}
          >
            Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
