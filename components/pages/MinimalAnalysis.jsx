import React from 'react';

export default function MinimalAnalysis() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Minimal Analysis Page</h1>
          <p className="text-slate-700 text-lg max-w-2xl mx-auto">This is a minimal version to test if the basic structure works.</p>
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Step 1: URL Input</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Blog URL</label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourblog.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Competitor URL</label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://competitor.com"
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
