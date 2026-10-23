import React from "react";
import { Link } from "react-router-dom";
import ReportExport from "./ReportExport.jsx";
export default function DataTools({
  kind,
  params,
  importable = false,
  disabled = false,
}) {
  return (
    <div className="data-tools">
      <ReportExport
        path={`/trao_doi_du_lieu/${kind}/xuat?${params || ""}`}
        disabled={disabled}
      />
      {importable && (
        <Link className="button" to={`/quan-tri/nhap-xuat?phan_he=${kind}`}>
          Nhập Excel
        </Link>
      )}
    </div>
  );
}
