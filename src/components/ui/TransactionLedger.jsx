import { useEffect, useState, useCallback } from 'react';
import { walletApi } from '../../api/walletApi';
import { useAuth } from '../../context/AuthContext';

// Cache tên user để tránh gọi API lặp lại
const nameCache = {};

async function resolveName(id) {
  if (!id) return null;
  if (nameCache[id]) return nameCache[id];
  try {
    const res = await walletApi.getUserName(id);
    nameCache[id] = res.data.fullName;
    return res.data.fullName;
  } catch {
    return `#${id}`;
  }
}

function shortHash(hash) {
  if (!hash) return null;
  return hash.slice(0, 8) + '...' + hash.slice(-6);
}

export default function TransactionLedger({ limit = 5 }) {
  const { user } = useAuth();
  const [txs, setTxs] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);

  const loadNames = useCallback(async (list) => {
    if (!Array.isArray(list)) return;
    const ids = new Set();
    list.forEach(tx => {
      if (tx.fromUserId) ids.add(tx.fromUserId);
      if (tx.toUserId) ids.add(tx.toUserId);
    });
    const resolved = {};
    await Promise.all([...ids].map(async id => {
      resolved[id] = await resolveName(id);
    }));
    setNames(prev => ({ ...prev, ...resolved }));
  }, []);

  useEffect(() => {
    walletApi.getTransactions()
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setTxs(data);
        loadNames(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadNames]);

  if (loading) return (
    <div className="space-y-2">
      {[1,2,3]?.map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!Array.isArray(txs) || txs.length === 0) return (
    <p className="text-center text-gray-400 text-sm py-8">Chưa có giao dịch nào</p>
  );

  const displayTxs = limit ? txs?.slice(0, limit) : txs;

  return (
    <div className="space-y-2">
      {displayTxs?.map(tx => {
        let isIn = false;
        if (tx.toUserId === user?.userId) {
            isIn = true;
        } else if (tx.fromUserId === user?.userId) {
            isIn = false;
        } else {
            isIn = tx.type === 'IN';
        }
        
        const counterpartyId = isIn ? tx.fromUserId : tx.toUserId;
        const counterpartyName = counterpartyId ? (names[counterpartyId] || `#${counterpartyId}`) : null;

        return (
          <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start gap-3">
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
                    ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {isIn ? '↓ Nhận' : '↑ Gửi'}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : ''}
                  </span>
                </div>

                {tx.note && (
                  <p className="text-sm text-gray-700 truncate">{tx.note}</p>
                )}

                {counterpartyName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isIn ? 'Từ: ' : 'Đến: '}
                    <span className="font-medium text-gray-700">{counterpartyName}</span>
                  </p>
                )}

                {tx.txHash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 font-mono mt-0.5 block truncate"
                    title={tx.txHash}
                  >
                    🔗 {shortHash(tx.txHash)}
                  </a>
                )}
              </div>

              {/* Right: amount */}
              <div className="shrink-0 text-right">
                <p className={`font-bold text-lg ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                  {isIn ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">token</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
