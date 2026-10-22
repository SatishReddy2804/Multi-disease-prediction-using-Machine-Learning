import React, { useState, useEffect } from 'react';
import { History, Search, Filter, FileText, ArrowUpDown, Shield, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/history/');
      if (res.data?.results) {
        setHistory(res.data.results);
      } else if (Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      toast.error("Could not fetch prediction history");
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesDisease = diseaseFilter === 'all' || item.disease_type === diseaseFilter;
    const matchesSearch = search === '' || 
      item.disease_type.toLowerCase().includes(search.toLowerCase()) ||
      item.risk_level.toLowerCase().includes(search.toLowerCase());
    return matchesDisease && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-7 h-7 text-blue-600" />
            Clinical Diagnostic History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit logs of past predictions, patient risk levels, uncertainty flags, and data quality scores.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modules</option>
            <option value="heart">Heart</option>
            <option value="diabetes">Diabetes</option>
            <option value="parkinsons">Parkinson's</option>
            <option value="liver">Liver</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading historical records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No predictions recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run diagnostic evaluations from any disease module to view auditable records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Disease Module</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Trust Status</th>
                  <th className="py-3 px-4">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredHistory.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {item.disease_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.risk_level === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                        item.risk_level === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' :
                        item.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {(item.probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {item.trust_status || 'RELIABLE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.data_quality_score}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
