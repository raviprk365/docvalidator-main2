'use client'

import { DocumentAnalysisView } from '@/app/components/analysis/DocumentAnalysisView'
import { Header } from '@/app/components/layout/Header'

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DocumentAnalysisView />
    </div>
  )
}