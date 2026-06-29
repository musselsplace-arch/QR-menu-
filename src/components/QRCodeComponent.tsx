import React, { useState, useRef } from 'react';
import { QrCode, Download, Printer, ExternalLink, RefreshCw, Smile, Eye } from 'lucide-react';
import { Table } from '../types';

interface QRCodeComponentProps {
  table: Table;
  appUrl: string;
  onSimulateScan: (tableId: string) => void;
}

export default function QRCodeComponent({ table, appUrl, onSimulateScan }: QRCodeComponentProps) {
  const [qrColor, setQrColor] = useState('#000000');
  const [qrSize, setQrSize] = useState(250);
  const qrRef = useRef<HTMLDivElement>(null);

  // Construct target QR Link:
  // e.g. https://your-app-url.com?table=1
  // We utilize the window.location.origin in the browser, falling back to appUrl.
  const originUrl = typeof window !== 'undefined' ? window.location.origin : appUrl;
  const targetUrl = `${originUrl}?table=${table.number}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&color=${qrColor.replace('#', '')}&data=${encodeURIComponent(targetUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${table.name} - QR Code</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fira+GO:wght@400;600;700&display=swap');
            body {
              font-family: 'Fira GO', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #ffffff;
              color: #1a1a1a;
            }
            .card {
              border: 3px double #b4975a;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            }
            .header {
              font-size: 20px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 13px;
              color: #b4975a;
              margin-bottom: 25px;
              font-weight: 600;
            }
            .qr-container {
              background: #ffffff;
              padding: 15px;
              border-radius: 12px;
              display: inline-block;
              border: 1px solid #e2e8f0;
              margin-bottom: 25px;
            }
            .instruction {
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #2d3748;
            }
            .sub-instruction {
              font-size: 11px;
              color: #718096;
              max-width: 250px;
              margin: 0 auto;
              line-height: 1.4;
            }
            @media print {
              body { background: none; }
              .card { box-shadow: none; border: 3px double #000; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">${table.name}</div>
            <div class="subtitle">BISTRO & WINE BAR</div>
            <div class="qr-container">
              <img src="${qrImageUrl}" alt="QR Menu for ${table.name}" width="${qrSize}" height="${qrSize}" />
            </div>
            <div class="instruction">დაასკანირეთ კოდი კამერით</div>
            <div class="sub-instruction">გაეცანით ჩვენს მენიუს უგემრიელესი აღწერებით და ისიამოვნეთ სტუმრობით</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadImage = () => {
    // Open standard target in a new window for downloading easily
    window.open(qrImageUrl, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center">
      {/* Table Badge */}
      <div className="w-full flex justify-between items-center border-b border-dashed border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800 text-sm">{table.name}</span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
          კოდი მზად არის
        </span>
      </div>

      {/* Frame Preview wrapper */}
      <div 
        ref={qrRef}
        className="w-full max-w-sm border-2 border-double border-amber-600/30 rounded-2xl p-6 flex flex-col items-center text-center bg-slate-50/50 relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600/30 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600/30 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600/30 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600/30 rounded-br-xl"></div>

        <h3 className="text-base font-bold text-slate-800 mt-2 mb-1 tracking-wider uppercase font-serif">
          {table.name}
        </h3>
        <p className="text-[10px] text-amber-600 font-semibold tracking-widest uppercase mb-5">
          Bistro & Wine Bar
        </p>

        {/* QR Core Box */}
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/60 inline-flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
          <img 
            src={qrImageUrl} 
            alt={`QR Code for ${table.name}`}
            className="w-48 h-48 block rounded-md"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="mt-5 mb-2">
          <p className="text-xs font-semibold text-slate-700">დაასკანირეთ მენიუსთვის</p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[210px] mx-auto leading-relaxed">
            მენიუ წარმოდგენილია მადისმომგვრელი აღწერებით ინგრედენტების სიების გარეშე
          </p>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="w-full mt-6 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
            QR კოდის ფერი
          </label>
          <div className="flex gap-2">
            {[
              { color: '#000000', label: 'შავი' },
              { color: '#b45309', label: 'ოქროსფერი' },
              { color: '#1e3a8a', label: 'ლურჯი' },
              { color: '#064e3b', label: 'მწვანე' },
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setQrColor(preset.color)}
                className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${
                  qrColor === preset.color
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
                style={{ borderLeftWidth: '4px', borderLeftColor: preset.color }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions for Restaurateur */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleDownloadImage}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Download QR image directly"
          >
            <Download className="w-3.5 h-3.5" />
            ჩამოტვირთვა
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-amber-700 bg-amber-50/60 border border-amber-100 rounded-xl hover:bg-amber-100/60 transition-colors cursor-pointer"
            title="Print stylized card"
          >
            <Printer className="w-3.5 h-3.5" />
            დაბეჭდვა
          </button>
        </div>

        {/* Live Simulator Link */}
        <button
          onClick={() => onSimulateScan(table.id)}
          className="w-full mt-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          სტუმრის სიმულატორის გაშვება (ამ მაგიდით)
        </button>

        <div className="text-center">
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors mt-1 hover:underline"
          >
            პირდაპირი ბმული: {targetUrl.length > 32 ? targetUrl.substring(0, 32) + '...' : targetUrl}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
