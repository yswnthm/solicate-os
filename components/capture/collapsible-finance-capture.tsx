"use client";

import { useState } from "react";
import { FinanceCaptureFlow, type FinanceCaptureFormOptions } from "./finance-capture-flow";

export function CollapsibleFinanceCapture({ options }: { options: FinanceCaptureFormOptions }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: "1.5rem", 
          cursor: "pointer", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Finance Capture</h2>
          <p className="muted" style={{ margin: 0 }}>Log transactions, allocate funds, or update invoices in plain English.</p>
        </div>
        <div className="muted" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px", background: "var(--bg-inset)" }}>
          {isOpen ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div style={{ padding: "0 1.5rem 1.5rem 1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
          <FinanceCaptureFlow options={options} />
        </div>
      )}
    </div>
  );
}
